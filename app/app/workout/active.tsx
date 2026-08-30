import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  InputAccessoryView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flag, Plus, Timer, Trash2 } from 'lucide-react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { BRAND_FG, useThemeColors } from '@/lib/theme';
import { haptics } from '@/lib/haptics';
import { durations } from '@/lib/motion';
import { toast } from '@/lib/toastStore';
import { formatClock } from '@/lib/format';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useExercisePickerStore } from '@/features/exercises/pickerStore';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import { SET_ROW_ACCESSORY_ID, useSetFocusFlow } from '@/features/workout/useSetFocusFlow';
import { ExerciseCard } from '@/features/workout/components/ExerciseCard';
import { RestTimerBar } from '@/features/workout/components/RestTimerBar';
import { SetAdvanceBar } from '@/features/workout/components/SetAdvanceBar';

/** Typed-but-unchecked sets the finish guard warns about. */
interface FinishGuard {
  pending: { exerciseId: string; setId: string }[];
  /** Keyed by the active-exercise id — the same exercise can be added twice. */
  byExercise: { id: string; name: string; count: number }[];
}

/**
 * The header clock is the only thing on this screen that needs a 1Hz tick, so
 * it ticks alone — the session's set rows must never re-render on time alone.
 */
function ElapsedClock({ startedAt, suffix }: { startedAt: number; suffix: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const elapsed = Math.floor((now - startedAt) / 1000);
  return (
    <AppText variant="caption">
      {formatClock(elapsed)} · {suffix}
    </AppText>
  );
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const session = useActiveSessionStore((s) => s.session);
  const hasRestTimer = useActiveSessionStore((s) => s.restTimer !== null);
  const saving = useActiveSessionStore((s) => s.saving);
  const justPR = useActiveSessionStore((s) => s.justPR);
  const addExercise = useActiveSessionStore((s) => s.addExercise);
  const discard = useActiveSessionStore((s) => s.discard);
  const finish = useActiveSessionStore((s) => s.finish);
  const clearPR = useActiveSessionStore((s) => s.clearPR);
  const requestPick = useExercisePickerStore((s) => s.requestPick);
  const [finishError, setFinishError] = useState(false);
  const [finishGuard, setFinishGuard] = useState<FinishGuard | null>(null);
  const { confirm, element: confirmElement } = useConfirmSheet();

  const flow = useSetFocusFlow();

  // Badges must outlive `justPR` (cleared right after it's consumed), so shown
  // PRs are tracked in screen state keyed by set id — this is what lets a
  // completed set keep showing "PR" after scrolling away and back.
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [celebrateSetId, setCelebrateSetId] = useState<string | null>(null);

  useEffect(() => {
    if (!justPR) return;
    const target = useActiveSessionStore
      .getState()
      .session?.exercises.find((e) => e.id === justPR.activeExerciseId)
      ?.sets.find((s) => s.id === justPR.setId);

    // Deliberately an effect, not a render-phase adjustment like the one below:
    // the celebration fires haptics and a delayed second tap, which must not run
    // during render. `justPR` is a one-shot store signal cleared at the end, so
    // this runs once per PR — the extra pass it costs is bounded and rare.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrSetIds((prev) => (prev.has(justPR.setId) ? prev : new Set(prev).add(justPR.setId)));
    setCelebrateSetId(justPR.setId);
    toast.pr(target ? `New PR · ${target.weight ?? '—'} × ${target.reps ?? '—'}` : 'New PR!');
    haptics.pr();
    clearPR();
  }, [justPR, clearPR]);

  // Un-completing or deleting a set retires its PR: re-completing it has to earn
  // the badge again, otherwise a corrected-downward set keeps a stale one.
  // Adjusted during render rather than in an effect so the badge never survives
  // a frame past the set it belonged to. Dropping the id (rather than deriving
  // the visible set) is what makes the PR need re-earning.
  const [syncedSession, setSyncedSession] = useState(session);
  if (syncedSession !== session) {
    setSyncedSession(session);
    if (session) {
      const completed = new Set(
        session.exercises.flatMap((e) => e.sets.filter((s) => s.completed).map((s) => s.id)),
      );
      setPrSetIds((prev) => {
        const next = new Set([...prev].filter((id) => completed.has(id)));
        return next.size === prev.size ? prev : next;
      });
    }
  }

  useEffect(() => {
    if (!celebrateSetId) return;
    // Held until the glow's ramp + decay have both finished.
    const t = setTimeout(() => setCelebrateSetId(null), durations.enter + durations.glow);
    return () => clearTimeout(t);
  }, [celebrateSetId]);

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

  const completedSets = session.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0,
  );

  const onAddExercise = () => {
    requestPick((exercise) => addExercise(exercise.id));
    router.push('/exercise/picker');
  };

  const onDiscard = async () => {
    const ok = await confirm({
      title: 'Discard workout?',
      message: 'All logged sets from this session will be lost.',
      confirmLabel: 'Discard workout',
      cancelLabel: 'Keep training',
    });
    if (ok) discard();
  };

  const doFinish = async () => {
    setFinishError(false);
    const result = await finish();
    if (result === 'empty') {
      discard();
      return;
    }
    if (result) {
      haptics.success();
      // Navigate to the summary first (unmounts this screen so the discard
      // effect can't fire), then clear the persisted active session.
      router.replace({ pathname: '/workout/[id]', params: { id: result } });
      discard();
    } else {
      setFinishError(true);
    }
  };

  const onFinish = () => {
    // Typed-but-unchecked sets would be silently dropped by finish() — surface
    // them instead of losing work the user visibly put in.
    const byExercise = session.exercises
      .map((e) => ({
        id: e.id,
        name: exerciseLookup(e.exerciseId)?.name ?? 'Exercise',
        setIds: e.sets
          .filter((s) => !s.completed && (s.weight != null || s.reps != null))
          .map((s) => s.id),
      }))
      .filter((x) => x.setIds.length > 0);

    if (byExercise.length === 0) {
      void doFinish();
      return;
    }
    haptics.warning();
    setFinishGuard({
      pending: byExercise.flatMap((e) => e.setIds.map((setId) => ({ exerciseId: e.id, setId }))),
      byExercise: byExercise.map(({ id, name, setIds }) => ({
        id,
        name,
        count: setIds.length,
      })),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      {/* Header: elapsed time + finish */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="gap-0.5">
          <AppText variant="heading">{session.name}</AppText>
          <View className="flex-row items-center gap-1.5">
            <Timer size={13} color={colors.contentFaint} />
            <ElapsedClock
              startedAt={session.startedAt}
              suffix={`${completedSets} ${completedSets === 1 ? 'set' : 'sets'} done`}
            />
          </View>
        </View>
        <View className="flex-row gap-2">
          <IconButton
            icon={<Trash2 size={18} color={colors.danger} />}
            onPress={onDiscard}
            accessibilityLabel="Discard workout"
          />
          <PressableScale
            onPress={onFinish}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
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
            Couldn&apos;t save the workout. Check your connection and tap Finish again.
          </AppText>
        </View>
      ) : null}

      {hasRestTimer ? <RestTimerBar /> : null}

      {/* Slides up/down as the rest bar appears instead of jumping. */}
      <Animated.View style={{ flex: 1 }} layout={LinearTransition.duration(durations.enter)}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerClassName="gap-4 px-5 pb-28 pt-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {session.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                prSetIds={prSetIds}
                celebrateSetId={celebrateSetId}
                flow={flow}
              />
            ))}

            <Button
              label="Add exercise"
              variant="secondary"
              icon={<Plus size={16} color={colors.content} />}
              onPress={onAddExercise}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={SET_ROW_ACCESSORY_ID}>
          <View className="flex-row justify-end border-t border-surface-muted bg-surface-elevated px-4 py-2">
            <PressableScale onPress={flow.advance} hitSlop={8} className="px-2 py-1">
              <AppText className="font-bold text-[15px] text-brand-text">Next</AppText>
            </PressableScale>
          </View>
        </InputAccessoryView>
      ) : null}
      {Platform.OS === 'android' ? <SetAdvanceBar onNext={flow.advance} /> : null}

      <BottomSheet
        visible={finishGuard !== null}
        onClose={() => setFinishGuard(null)}
        title={
          finishGuard
            ? `${finishGuard.pending.length} ${finishGuard.pending.length === 1 ? 'set' : 'sets'} not checked off`
            : undefined
        }
      >
        {finishGuard ? (
          <View className="gap-3">
            <AppText variant="body">
              These sets have weight or reps typed in but were never checked off. Finishing
              without them leaves them out of the workout.
            </AppText>
            <View className="gap-1">
              {finishGuard.byExercise.map((x) => (
                <AppText key={x.id} variant="caption">
                  {x.name} · {x.count} {x.count === 1 ? 'set' : 'sets'}
                </AppText>
              ))}
            </View>
            <Button
              label="Complete them & finish"
              onPress={() => {
                // Through the store so PR detection runs; no per-set haptic —
                // a batch completion shouldn't buzz N times.
                const store = useActiveSessionStore.getState();
                finishGuard.pending.forEach(({ exerciseId, setId }) =>
                  store.toggleSetComplete(exerciseId, setId),
                );
                setFinishGuard(null);
                void doFinish();
              }}
            />
            <Button
              label="Finish without them"
              variant="secondary"
              onPress={() => {
                setFinishGuard(null);
                void doFinish();
              }}
            />
            <Button label="Keep training" variant="ghost" onPress={() => setFinishGuard(null)} />
          </View>
        ) : null}
      </BottomSheet>

      {confirmElement}
    </SafeAreaView>
  );
}
