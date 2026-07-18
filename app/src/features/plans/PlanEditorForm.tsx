import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, X } from 'lucide-react-native';
import type { Goal, UpsertPlanInput, WorkoutPlan } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { PressableScale } from '@/components/ui/PressableScale';
import { TextField } from '@/components/ui/TextField';
import { useThemeColors } from '@/lib/theme';
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

interface DraftExercise {
  id?: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number | null;
}

interface DraftDay {
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
  const savePlan = useSavePlan();
  const requestPick = useExercisePickerStore((s) => s.requestPick);

  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [goal, setGoal] = useState<Goal>(plan?.goal ?? 'hypertrophy');
  const [daysPerWeek, setDaysPerWeek] = useState(plan?.daysPerWeek ?? 4);
  const [days, setDays] = useState<DraftDay[]>(
    plan?.days.map((d) => ({
      id: d.id,
      name: d.name,
      exercises: d.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        restSeconds: e.restSeconds,
      })),
    })) ?? [{ name: 'Day 1', exercises: [] }],
  );
  const [error, setError] = useState<string | null>(null);

  const updateDay = (index: number, patch: Partial<DraftDay>) =>
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const addExerciseToDay = (dayIndex: number) => {
    requestPick((exercise) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                exercises: [
                  ...d.exercises,
                  { exerciseId: exercise.id, targetSets: 3, targetReps: '8-12', restSeconds: 120 },
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
      setError('Give the plan a name');
      return;
    }
    if (days.every((d) => d.exercises.length === 0)) {
      setError('Add at least one exercise');
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
          restSeconds: e.restSeconds,
        })),
      })),
    };
    savePlan.mutate(
      { id: plan?.id, input },
      {
        onSuccess: (saved) => {
          if (plan) router.back();
          else router.replace({ pathname: '/plan/[id]', params: { id: saved.id } });
        },
      },
    );
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-36 pt-2" showsVerticalScrollIndicator={false}>
        <TextField label="Plan name" value={name} onChangeText={setName} placeholder="e.g. Push Pull Legs" error={error ?? undefined} />
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
              <Chip key={g.value} label={g.label} selected={goal === g.value} onPress={() => setGoal(g.value)} />
            ))}
          </View>
        </View>

        <Card className="flex-row items-center justify-between">
          <AppText variant="subheading">Days per week</AppText>
          <NumberStepper value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} />
        </Card>

        {days.map((day, dayIndex) => (
          <Card key={dayIndex} className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <TextField value={day.name} onChangeText={(t) => updateDay(dayIndex, { name: t })} placeholder={`Day ${dayIndex + 1}`} />
              </View>
              {days.length > 1 ? (
                <IconButton
                  icon={<Trash2 size={18} color={colors.danger} />}
                  onPress={() => setDays((prev) => prev.filter((_, i) => i !== dayIndex))}
                  accessibilityLabel="Remove day"
                />
              ) : null}
            </View>

            {day.exercises.map((exercise, exIndex) => {
              const info = exerciseLookup(exercise.exerciseId);
              return (
                <View key={exIndex} className="gap-3 rounded-xl bg-surface-muted/50 p-3">
                  <View className="flex-row items-center justify-between">
                    <AppText variant="subheading" className="flex-1" numberOfLines={1}>
                      {info?.name ?? 'Exercise'}
                    </AppText>
                    <PressableScale
                      onPress={() =>
                        updateDay(dayIndex, {
                          exercises: day.exercises.filter((_, i) => i !== exIndex),
                        })
                      }
                      hitSlop={8}
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
          onPress={() => setDays((prev) => [...prev, { name: `Day ${prev.length + 1}`, exercises: [] }])}
        />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-surface-muted bg-surface px-5 pb-8 pt-3">
        <Button label={plan ? 'Save changes' : 'Create plan'} size="lg" loading={savePlan.isPending} onPress={onSave} />
      </View>
    </View>
  );
}
