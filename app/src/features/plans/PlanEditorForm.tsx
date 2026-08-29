import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, X } from 'lucide-react-native';
import type { Goal, UpsertPlanInput, WorkoutPlan } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { IconButton } from '@/components/ui/IconButton';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { haptics } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';
import { toast } from '@/lib/toastStore';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useExercisePickerStore } from '@/features/exercises/pickerStore';
import { useSavePlan } from './hooks';

const GOALS: { value: Goal; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'general_fitness', label: 'General' },
  { value: 'endurance', label: 'Endurance' },
];

/**
 * Local-only identity for draft rows, never sent to the server (`onSave` picks
 * fields explicitly). Array indices can't do this job: they shift when a day or
 * exercise is removed, which mis-keys the lists and would make a pending undo
 * restore into whatever row slid into that slot.
 */
let draftSeq = 0;
const draftKey = () => `draft_${++draftSeq}`;

interface DraftExercise {
  key: string;
  id?: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  /** Carried through saves untouched — the server nulls anything omitted. */
  targetRpe: number | null;
  restSeconds: number | null;
  notes: string | null;
}

interface DraftDay {
  key: string;
  id?: string;
  name: string;
  exercises: DraftExercise[];
}

interface PlanEditorFormProps {
  /** Existing plan when editing; undefined when creating. */
  plan?: WorkoutPlan;
}

export function PlanEditorForm({ plan }: PlanEditorFormProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const savePlan = useSavePlan();
  const requestPick = useExercisePickerStore((s) => s.requestPick);
  const { confirm, element: confirmElement } = useConfirmSheet();

  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [goal, setGoal] = useState<Goal>(plan?.goal ?? 'hypertrophy');
  const [daysPerWeek, setDaysPerWeek] = useState(plan?.daysPerWeek ?? 4);
  const [days, setDays] = useState<DraftDay[]>(
    plan?.days.map((d) => ({
      key: draftKey(),
      id: d.id,
      name: d.name,
      exercises: d.exercises.map((e) => ({
        key: draftKey(),
        id: e.id,
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetRpe: e.targetRpe,
        restSeconds: e.restSeconds,
        notes: e.notes,
      })),
    })) ?? [{ key: draftKey(), name: 'Day 1', exercises: [] }],
  );
  /** Name-field validation only — everything else surfaces as a toast. */
  const [nameError, setNameError] = useState<string | null>(null);

  const updateDay = (index: number, patch: Partial<DraftDay>) =>
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const onRemoveDay = async (dayIndex: number) => {
    const day = days[dayIndex];
    // An empty day goes silently; one with content asks first.
    if (day.exercises.length > 0) {
      const ok = await confirm({
        title: `Remove ${day.name.trim() || `Day ${dayIndex + 1}`}?`,
        message: `Its ${day.exercises.length} exercise${day.exercises.length === 1 ? '' : 's'} go with it.`,
        confirmLabel: 'Remove day',
      });
      if (!ok) return;
    }
    setDays((prev) => prev.filter((_, i) => i !== dayIndex));
  };

  const onRemoveExercise = (dayIndex: number, exIndex: number) => {
    const day = days[dayIndex];
    const removed = day?.exercises[exIndex];
    if (!removed) return;
    updateDay(dayIndex, { exercises: day.exercises.filter((_, i) => i !== exIndex) });
    // Restore by the day's key, not its index — days can be removed while the
    // undo window is open, which would otherwise drop this into another day.
    toast.undo(`Removed ${exerciseLookup(removed.exerciseId)?.name ?? 'exercise'}`, () => {
      setDays((prev) =>
        prev.map((d) => {
          if (d.key !== day.key) return d;
          const exercises = [...d.exercises];
          exercises.splice(Math.min(exIndex, exercises.length), 0, removed);
          return { ...d, exercises };
        }),
      );
    });
  };

  const addExerciseToDay = (dayIndex: number) => {
    requestPick((exercise) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: [
                  ...d.exercises,
                  {
                    key: draftKey(),
                    exerciseId: exercise.id,
                    targetSets: 3,
                    targetReps: '8-12',
                    targetRpe: null,
                    restSeconds: 120,
                    notes: null,
                  },
                ],
              }
            : d,
        ),
      );
    });
    router.push('/exercise/picker');
  };

  const onSave = () => {
    if (!name.trim()) {
      haptics.warning();
      setNameError('Give the plan a name');
      return;
    }
    setNameError(null);
    if (days.every((d) => d.exercises.length === 0)) {
      // Not a name problem — pinning this under the name field (probably
      // scrolled far off screen) hid it. A toast is always visible.
      haptics.warning();
      toast.show({ message: 'Add at least one exercise first.', tone: 'warning' });
      return;
    }
    const input: UpsertPlanInput = {
      name: name.trim(),
      description: description.trim() || null,
      goal,
      daysPerWeek,
      isTemplate: false,
      days: days.map((d, di) => ({
        id: d.id,
        name: d.name.trim() || `Day ${di + 1}`,
        order: di,
        exercises: d.exercises.map((e, ei) => ({
          id: e.id,
          exerciseId: e.exerciseId,
          order: ei,
          targetSets: e.targetSets,
          targetReps: e.targetReps.trim() || '8-12',
          targetRpe: e.targetRpe,
          restSeconds: e.restSeconds,
          notes: e.notes?.trim() || null,
        })),
      })),
    };
    savePlan.mutate(
      { id: plan?.id, input },
      {
        onSuccess: (saved) => {
          haptics.success();
          if (plan) router.back();
          else router.replace({ pathname: '/plan/[id]', params: { id: saved.id } });
        },
        onError: () =>
          toast.show({
            message: "Couldn't save the plan. Check your connection and try again.",
            tone: 'warning',
          }),
      },
    );
  };

  return (
    // Same keyboard pattern as the auth screens; the footer sits in normal
    // flow (not absolute), so the keyboard lifts it instead of covering it.
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-8 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextField
          label="Plan name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push Pull Legs"
          error={nameError ?? undefined}
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What is this plan about?"
          multiline
        />

        <View className="gap-2">
          <AppText variant="label">Goal</AppText>
          <View className="flex-row flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip
                key={g.value}
                label={g.label}
                selected={goal === g.value}
                onPress={() => setGoal(g.value)}
              />
            ))}
          </View>
        </View>

        <Card className="flex-row items-center justify-between">
          <AppText variant="subheading">Days per week</AppText>
          <NumberStepper value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} />
        </Card>

        {days.map((day, dayIndex) => (
          <Card key={day.key} className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <TextField
                  value={day.name}
                  onChangeText={(t) => updateDay(dayIndex, { name: t })}
                  placeholder={`Day ${dayIndex + 1}`}
                />
              </View>
              {days.length > 1 ? (
                <IconButton
                  icon={<Trash2 size={18} color={colors.danger} />}
                  onPress={() => void onRemoveDay(dayIndex)}
                  accessibilityLabel="Remove day"
                />
              ) : null}
            </View>

            {day.exercises.map((exercise, exIndex) => {
              const info = exerciseLookup(exercise.exerciseId);
              return (
                <View key={exercise.key} className="gap-3 rounded-xl bg-surface-muted/50 p-3">
                  <View className="flex-row items-center justify-between">
                    <AppText variant="subheading" className="flex-1" numberOfLines={1}>
                      {info?.name ?? 'Exercise'}
                    </AppText>
                    <PressableScale
                      onPress={() => onRemoveExercise(dayIndex, exIndex)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Remove exercise"
                    >
                      <X size={16} color={colors.contentFaint} />
                    </PressableScale>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <View className="gap-1">
                      <AppText variant="caption">Sets</AppText>
                      <NumberStepper
                        value={exercise.targetSets}
                        onChange={(v) =>
                          updateDay(dayIndex, {
                            exercises: day.exercises.map((e, i) =>
                              i === exIndex ? { ...e, targetSets: v } : e,
                            ),
                          })
                        }
                        min={1}
                        max={10}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <AppText variant="caption">Reps</AppText>
                      <TextField
                        value={exercise.targetReps}
                        onChangeText={(t) =>
                          updateDay(dayIndex, {
                            exercises: day.exercises.map((e, i) =>
                              i === exIndex ? { ...e, targetReps: t } : e,
                            ),
                          })
                        }
                        placeholder="8-12"
                      />
                    </View>
                  </View>
                  <View className="gap-1">
                    <AppText variant="caption">Notes</AppText>
                    <TextField
                      value={exercise.notes ?? ''}
                      onChangeText={(t) =>
                        updateDay(dayIndex, {
                          exercises: day.exercises.map((e, i) =>
                            i === exIndex ? { ...e, notes: t } : e,
                          ),
                        })
                      }
                      placeholder="Cues, tempo, setup…"
                      multiline
                      maxLength={500}
                    />
                  </View>
                </View>
              );
            })}

            <Button
              label="Add exercise"
              variant="secondary"
              size="sm"
              icon={<Plus size={16} color={colors.content} />}
              onPress={() => addExerciseToDay(dayIndex)}
            />
          </Card>
        ))}

        <Button
          label="Add day"
          variant="ghost"
          icon={<Plus size={16} color={colors.contentMuted} />}
          onPress={() =>
            setDays((prev) => [
              ...prev,
              { key: draftKey(), name: `Day ${prev.length + 1}`, exercises: [] },
            ])
          }
        />
      </ScrollView>

      <View
        className="border-t border-surface-muted bg-surface px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          label={plan ? 'Save changes' : 'Create plan'}
          size="lg"
          loading={savePlan.isPending}
          onPress={onSave}
        />
      </View>

      {confirmElement}
    </KeyboardAvoidingView>
  );
}
