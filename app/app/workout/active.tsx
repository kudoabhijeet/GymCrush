import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Check, Flag, Plus, Timer, Trash2, X } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BRAND_FG, useThemeColors } from '@/lib/theme';
import { formatClock } from '@/lib/format';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useExercisePickerStore } from '@/features/exercises/pickerStore';
import {
  useActiveSessionStore,
  type ActiveExercise,
  type ActiveSet,
} from '@/features/workout/activeSessionStore';

/** Ticks once a second while mounted. */
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const session = useActiveSessionStore((s) => s.session);
  const restTimer = useActiveSessionStore((s) => s.restTimer);
  const saving = useActiveSessionStore((s) => s.saving);
  const addExercise = useActiveSessionStore((s) => s.addExercise);
  const skipRest = useActiveSessionStore((s) => s.skipRest);
  const discard = useActiveSessionStore((s) => s.discard);
  const finish = useActiveSessionStore((s) => s.finish);
  const requestPick = useExercisePickerStore((s) => s.requestPick);
  const now = useNow();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finishError, setFinishError] = useState(false);

  // Session was discarded — leave the screen. `finish()` navigates to the
  // summary itself (and briefly nulls the session mid-save), so skip while
  // saving to avoid a competing navigation. Never call back() with an empty
  // stack (throws "GO_BACK was not handled") — fall back to the tabs.
  useEffect(() => {
    if (session || saving) return;
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/log');
  }, [session, saving, router]);

  if (!session) return null;

  const elapsed = Math.floor((now - session.startedAt) / 1000);
  const restRemaining = restTimer ? Math.ceil((restTimer.endsAt - now) / 1000) : 0;
  const restActive = restTimer !== null && restRemaining > 0;
  const completedSets = session.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0,
  );

  const onAddExercise = () => {
    requestPick((exercise) => addExercise(exercise.id));
    router.push('/exercise/picker');
  };

  const onFinish = async () => {
    setFinishError(false);
    const id = await finish();
    if (id) {
      // Navigate to the summary first (unmounts this screen so the discard
      // effect can't fire), then clear the persisted active session.
      router.replace({ pathname: '/workout/[id]', params: { id } });
      discard();
    } else {
      setFinishError(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      {/* Header: elapsed time + finish */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="gap-0.5">
          <AppText variant="heading">{session.name}</AppText>
          <View className="flex-row items-center gap-1.5">
            <Timer size={13} color={colors.contentFaint} />
            <AppText variant="caption">
              {formatClock(elapsed)} · {completedSets} sets done
            </AppText>
          </View>
        </View>
        <View className="flex-row gap-2">
          <IconButton
            icon={<Trash2 size={18} color={colors.danger} />}
            onPress={() => setConfirmOpen(true)}
            accessibilityLabel="Discard workout"
          />
          <PressableScale
            onPress={onFinish}
            disabled={saving}
            className={`flex-row items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 ${saving ? 'opacity-60' : ''}`}
          >
            {saving ? (
              <ActivityIndicator size="small" color={BRAND_FG} />
            ) : (
              <Flag size={14} color={BRAND_FG} />
            )}
            <AppText className="font-bold text-[13px] text-brand-fg">
              {saving ? 'Saving…' : 'Finish'}
            </AppText>
          </PressableScale>
        </View>
      </View>

      {finishError ? (
        <View className="mx-5 mb-2 rounded-xl bg-danger/10 p-3">
          <AppText variant="caption" className="text-danger">
            Couldn't save the workout. Check your connection and tap Finish again.
          </AppText>
        </View>
      ) : null}

      {/* Rest timer bar */}
      {restActive ? (
        <View className="mx-5 mb-2 gap-2 rounded-2xl bg-brand/10 p-3">
          <View className="flex-row items-center justify-between">
            <AppText className="font-bold text-[15px] text-brand-text">
              Rest · {formatClock(restRemaining)}
            </AppText>
            <PressableScale onPress={skipRest} hitSlop={8}>
              <AppText variant="caption" className="font-semibold text-content-muted">
                Skip
              </AppText>
            </PressableScale>
          </View>
          <ProgressBar
            progress={restRemaining / restTimer!.durationSec}
            height={4}
          />
        </View>
      ) : null}

      <ScrollView contentContainerClassName="gap-4 px-5 pb-28 pt-1" showsVerticalScrollIndicator={false}>
        {session.exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}

        <Button
          label="Add exercise"
          variant="secondary"
          icon={<Plus size={16} color={colors.content} />}
          onPress={onAddExercise}
        />
      </ScrollView>

      <BottomSheet visible={confirmOpen} onClose={() => setConfirmOpen(false)} title="Discard workout?">
        <View className="gap-3">
          <AppText variant="body">All logged sets from this session will be lost.</AppText>
          <Button
            label="Discard workout"
            variant="danger"
            onPress={() => {
              setConfirmOpen(false);
              discard();
            }}
          />
          <Button label="Keep training" variant="secondary" onPress={() => setConfirmOpen(false)} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function ExerciseCard({ exercise }: { exercise: ActiveExercise }) {
  const colors = useThemeColors();
  const addSet = useActiveSessionStore((s) => s.addSet);
  const removeExercise = useActiveSessionStore((s) => s.removeExercise);
  const info = exerciseLookup(exercise.exerciseId);

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <AppText variant="subheading" className="flex-1" numberOfLines={1}>
          {info?.name ?? 'Exercise'}
        </AppText>
        <PressableScale
          onPress={() => removeExercise(exercise.id)}
          hitSlop={8}
          accessibilityLabel="Remove exercise"
        >
          <X size={16} color={colors.contentFaint} />
        </PressableScale>
      </View>

      {/* Column headers */}
      <View className="flex-row items-center gap-3 px-1">
        <AppText variant="label" className="w-8">
          Set
        </AppText>
        <AppText variant="label" className="flex-1 text-center">
          Prev
        </AppText>
        <AppText variant="label" className="w-16 text-center">
          kg
        </AppText>
        <AppText variant="label" className="w-14 text-center">
          Reps
        </AppText>
        <View className="w-9" />
      </View>

      {exercise.sets.map((set) => (
        <SetRow key={set.id} exerciseId={exercise.id} set={set} />
      ))}

      <PressableScale
        onPress={() => addSet(exercise.id)}
        className="flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed border-surface-muted py-2.5"
      >
        <Plus size={14} color={colors.contentMuted} />
        <AppText variant="caption" className="font-semibold">
          Add set
        </AppText>
      </PressableScale>
    </Card>
  );
}

function SetRow({ exerciseId, set }: { exerciseId: string; set: ActiveSet }) {
  const colors = useThemeColors();
  const updateSet = useActiveSessionStore((s) => s.updateSet);
  const toggleSetComplete = useActiveSessionStore((s) => s.toggleSetComplete);

  const prevLabel = set.prev
    ? `${set.prev.weight ?? '—'} × ${set.prev.reps ?? '—'}`
    : '—';

  const onToggle = () => {
    if (!set.completed && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleSetComplete(exerciseId, set.id);
  };

  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl px-1 py-1 ${
        set.completed ? 'bg-brand/10' : ''
      }`}
    >
      <AppText className="w-8 font-bold text-[15px] text-content-muted">{set.setNumber}</AppText>
      <AppText variant="caption" className="flex-1 text-center">
        {prevLabel}
      </AppText>
      <TextInput
        value={set.weight != null ? `${set.weight}` : ''}
        onChangeText={(t) =>
          updateSet(exerciseId, set.id, { weight: t ? Number(t.replace(',', '.')) || 0 : null })
        }
        placeholder={set.prev?.weight != null ? `${set.prev.weight}` : '0'}
        placeholderTextColor={colors.contentFaint}
        keyboardType="decimal-pad"
        className="w-16 rounded-lg bg-surface-muted px-2 py-2 text-center font-bold text-[15px] text-content"
      />
      <TextInput
        value={set.reps != null ? `${set.reps}` : ''}
        onChangeText={(t) =>
          updateSet(exerciseId, set.id, { reps: t ? parseInt(t, 10) || 0 : null })
        }
        placeholder={set.prev?.reps != null ? `${set.prev.reps}` : '0'}
        placeholderTextColor={colors.contentFaint}
        keyboardType="number-pad"
        className="w-14 rounded-lg bg-surface-muted px-2 py-2 text-center font-bold text-[15px] text-content"
      />
      <PressableScale
        onPress={onToggle}
        scaleTo={0.85}
        accessibilityLabel={set.completed ? 'Mark set incomplete' : 'Complete set'}
        className={`h-9 w-9 items-center justify-center rounded-lg ${
          set.completed ? 'bg-brand' : 'bg-surface-muted'
        }`}
      >
        <Check
          size={16}
          color={set.completed ? BRAND_FG : colors.contentFaint}
          strokeWidth={3}
        />
      </PressableScale>
    </View>
  );
}
