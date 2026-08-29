import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Award,
  Check,
  Copy,
  Flag,
  Flame,
  Plus,
  StickyNote,
  Timer,
  Trash2,
  Weight,
  X,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { BRAND_FG, useThemeColors, type ThemeColors } from '@/lib/theme';
import { formatClock, formatPrescription, weightUnitLabel } from '@/lib/format';
import { BAR_WEIGHTS, PLATES, calcPlateLoad, type PlateUnit } from '@/lib/plates';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useExercisePickerStore } from '@/features/exercises/pickerStore';
import { useProfileStore } from '@/features/profile/profileStore';
import {
  useActiveSessionStore,
  type ActiveExercise,
  type ActiveSet,
  type PlanPrescription,
} from '@/features/workout/activeSessionStore';

/** RPE is rated after the set, so the picker only makes sense post-completion. */
const RPE_VALUES = [6, 7, 8, 9, 10] as const;

/** Shared by both weight and reps inputs — iOS numeric keypads have no Return key. */
const SET_ROW_ACCESSORY_ID = 'set-row-accessory';

type ToggleSetComplete = (activeExerciseId: string, setId: string) => void;

/**
 * The one path that completes a set: Check tap, reps-submit, and the iOS
 * accessory bar's "Next" all funnel through this so haptics + PR detection
 * (inside the store) stay identical everywhere.
 */
function fireSetComplete(
  toggleSetComplete: ToggleSetComplete,
  exerciseId: string,
  setId: string,
  wasCompleted: boolean,
) {
  if (!wasCompleted && Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  toggleSetComplete(exerciseId, setId);
}

/** Ticks once a second while mounted. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
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
  const justPR = useActiveSessionStore((s) => s.justPR);
  const addExercise = useActiveSessionStore((s) => s.addExercise);
  const skipRest = useActiveSessionStore((s) => s.skipRest);
  const discard = useActiveSessionStore((s) => s.discard);
  const finish = useActiveSessionStore((s) => s.finish);
  const clearPR = useActiveSessionStore((s) => s.clearPR);
  const toggleSetComplete = useActiveSessionStore((s) => s.toggleSetComplete);
  const requestPick = useExercisePickerStore((s) => s.requestPick);
  const now = useNow();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finishError, setFinishError] = useState(false);

  // Badges must outlive `justPR` (cleared right after it's consumed), so shown
  // PRs are tracked in screen state keyed by set id — this is what lets a
  // completed set keep showing "PR" after scrolling away and back.
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [celebrateSetId, setCelebrateSetId] = useState<string | null>(null);
  const [prToast, setPrToast] = useState<{ key: string; label: string } | null>(null);

  // Fires the rest-timer-done haptic exactly once per rest period: `now` ticks
  // every second, so without this ref the check below would re-fire on every
  // tick after the countdown reaches zero (and it must stay silent on Skip).
  const restHapticFiredForRef = useRef<number | null>(null);

  // Keyboard flow: the screen owns a flat set order plus the weight-input
  // registry, so focus can jump across exercise-card boundaries (weight ->
  // reps -> next set's weight). The reps ref registry only needs to be
  // reachable from the accessory bar below, since same-row weight->reps
  // focusing happens locally inside each SetRow.
  const weightRefs = useRef<Record<string, TextInput | null>>({});
  const repsRefs = useRef<Record<string, TextInput | null>>({});
  // Plain ref, not state: the accessory bar reads this on tap, and turning it
  // into state would re-render the whole screen on every field focus.
  const activeFieldRef = useRef<{ setId: string; field: 'weight' | 'reps' } | null>(null);

  const registerWeightRef = (setId: string, el: TextInput | null) => {
    weightRefs.current[setId] = el;
  };
  const registerRepsRef = (setId: string, el: TextInput | null) => {
    repsRefs.current[setId] = el;
  };
  const onFieldFocus = (setId: string, field: 'weight' | 'reps') => {
    activeFieldRef.current = { setId, field };
  };
  const focusReps = (setId: string) => repsRefs.current[setId]?.focus();
  const focusAfter = (setId: string) => {
    const flatSetIds = session ? session.exercises.flatMap((e) => e.sets.map((s) => s.id)) : [];
    const idx = flatSetIds.indexOf(setId);
    const nextId = idx >= 0 ? flatSetIds[idx + 1] : undefined;
    const nextInput = nextId ? weightRefs.current[nextId] : null;
    if (nextInput) nextInput.focus();
    else Keyboard.dismiss();
  };

  const onAccessoryNext = () => {
    const active = activeFieldRef.current;
    if (!active) return;
    if (active.field === 'weight') {
      focusReps(active.setId);
      return;
    }
    const found = session?.exercises
      .flatMap((e) => e.sets.map((s) => ({ exerciseId: e.id, set: s })))
      .find((x) => x.set.id === active.setId);
    if (found && !found.set.completed) {
      fireSetComplete(toggleSetComplete, found.exerciseId, found.set.id, found.set.completed);
    }
    focusAfter(active.setId);
  };

  useEffect(() => {
    if (!restTimer) return;
    if (now < restTimer.endsAt) return;
    if (restHapticFiredForRef.current === restTimer.endsAt) return;
    restHapticFiredForRef.current = restTimer.endsAt;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [now, restTimer]);

  useEffect(() => {
    if (!justPR) return;
    const target = useActiveSessionStore
      .getState()
      .session?.exercises.find((e) => e.id === justPR.activeExerciseId)
      ?.sets.find((s) => s.id === justPR.setId);

    // Deliberately an effect, not a render-phase adjustment like the two below:
    // the celebration fires haptics and a delayed second tap, which must not run
    // during render. `justPR` is a one-shot store signal cleared at the end, so
    // this runs once per PR — the extra pass it costs is bounded and rare.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrSetIds((prev) => (prev.has(justPR.setId) ? prev : new Set(prev).add(justPR.setId)));
    setCelebrateSetId(justPR.setId);
    setPrToast({
      key: `${justPR.setId}-${Date.now()}`,
      label: target ? `New PR · ${target.weight ?? '—'} × ${target.reps ?? '—'}` : 'New PR!',
    });
    if (Platform.OS !== 'web') {
      // Heavy + a trailing Medium reads as a distinct little "thud-tick", set
      // apart from the plain Medium (set-complete) and Success (rest-done) taps.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 90);
    }
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
    const t = setTimeout(() => setCelebrateSetId(null), 900);
    return () => clearTimeout(t);
  }, [celebrateSetId]);

  useEffect(() => {
    if (!prToast) return;
    const t = setTimeout(() => setPrToast(null), 2500);
    return () => clearTimeout(t);
  }, [prToast]);

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
              {formatClock(elapsed)} · {completedSets} {completedSets === 1 ? 'set' : 'sets'} done
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
            Couldn&apos;t save the workout. Check your connection and tap Finish again.
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
          <ProgressBar progress={restRemaining / restTimer!.durationSec} height={4} />
        </View>
      ) : null}

      {prToast ? (
        <Animated.View
          key={prToast.key}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(180)}
          pointerEvents="none"
          className="absolute left-5 right-5 top-3 z-50 flex-row items-center gap-2 rounded-2xl bg-content px-4 py-3"
        >
          <Award size={16} color={colors.brand} />
          <AppText className="flex-1 font-bold text-[13px]" color="text-surface">
            {prToast.label}
          </AppText>
        </Animated.View>
      ) : null}

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
              registerWeightRef={registerWeightRef}
              registerRepsRef={registerRepsRef}
              onFieldFocus={onFieldFocus}
              focusReps={focusReps}
              focusAfter={focusAfter}
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

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={SET_ROW_ACCESSORY_ID}>
          <View className="flex-row justify-end border-t border-surface-muted bg-surface-elevated px-4 py-2">
            <PressableScale onPress={onAccessoryNext} hitSlop={8} className="px-2 py-1">
              <AppText className="font-bold text-[15px] text-brand-text">Next</AppText>
            </PressableScale>
          </View>
        </InputAccessoryView>
      ) : null}

      <BottomSheet
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Discard workout?"
      >
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

/** Most recent set with a known weight — own value, else its ghosted previous. */
function lastKnownWeight(exercise: ActiveExercise): number | null {
  for (let i = exercise.sets.length - 1; i >= 0; i--) {
    const w = exercise.sets[i].weight ?? exercise.sets[i].prev?.weight;
    if (w != null) return w;
  }
  return null;
}

interface KeyboardFlowProps {
  registerWeightRef: (setId: string, el: TextInput | null) => void;
  registerRepsRef: (setId: string, el: TextInput | null) => void;
  onFieldFocus: (setId: string, field: 'weight' | 'reps') => void;
  focusReps: (setId: string) => void;
  focusAfter: (setId: string) => void;
}

function ExerciseCard({
  exercise,
  prSetIds,
  celebrateSetId,
  registerWeightRef,
  registerRepsRef,
  onFieldFocus,
  focusReps,
  focusAfter,
}: {
  exercise: ActiveExercise;
  prSetIds: Set<string>;
  celebrateSetId: string | null;
} & KeyboardFlowProps) {
  const colors = useThemeColors();
  const addSet = useActiveSessionStore((s) => s.addSet);
  const updateSet = useActiveSessionStore((s) => s.updateSet);
  const removeSet = useActiveSessionStore((s) => s.removeSet);
  const removeExercise = useActiveSessionStore((s) => s.removeExercise);
  const defaultUnits = useProfileStore((s) => s.units);
  const info = exerciseLookup(exercise.exerciseId);
  const isBarbell = info?.equipment === 'barbell';
  const rx = exercise.prescription;

  const [plateSheetOpen, setPlateSheetOpen] = useState(false);
  const [plateUnit, setPlateUnit] = useState<PlateUnit>(defaultUnits);
  const [plateBarWeight, setPlateBarWeight] = useState<number>(BAR_WEIGHTS[defaultUnits][0]);
  const [plateTarget, setPlateTarget] = useState<number>(BAR_WEIGHTS[defaultUnits][0]);
  const [notesExpanded, setNotesExpanded] = useState(false);
  // Lifted here (rather than per-row) so a workout with many sets mounts one
  // action sheet per exercise, not one per set.
  const [actionsSetId, setActionsSetId] = useState<string | null>(null);
  const actionsSet = exercise.sets.find((s) => s.id === actionsSetId) ?? null;
  const canDeleteSets = exercise.sets.length > 1;

  const onOpenPlates = () => {
    setPlateTarget(lastKnownWeight(exercise) ?? plateBarWeight);
    setPlateSheetOpen(true);
  };

  const onPlateUnitChange = (next: PlateUnit) => {
    setPlateUnit(next);
    setPlateBarWeight(BAR_WEIGHTS[next][0]);
  };

  const onToggleWarmup = (setId: string, isWarmup: boolean) => {
    updateSet(exercise.id, setId, { isWarmup: !isWarmup });
  };
  const onDeleteSet = (setId: string) => {
    removeSet(exercise.id, setId);
    setActionsSetId((cur) => (cur === setId ? null : cur));
  };

  const completedCount = exercise.sets.filter((s) => s.completed).length;
  const totalCount = exercise.sets.length;
  const subtitle = [
    rx ? formatPrescription(rx.targetSets, rx.targetReps, rx.targetRpe) : null,
    `${completedCount} of ${totalCount} set${totalCount === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  // Latest-completed drives which row gets the full interactive RPE picker —
  // earlier ones collapse to a static badge so completing sets in order
  // doesn't keep shoving the next row down as the thumb travels toward it.
  let lastCompletedSetId: string | null = null;
  for (let i = exercise.sets.length - 1; i >= 0; i--) {
    if (exercise.sets[i].completed) {
      lastCompletedSetId = exercise.sets[i].id;
      break;
    }
  }

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-0.5 pr-2">
          <AppText variant="subheading" numberOfLines={1}>
            {info?.name ?? 'Exercise'}
          </AppText>
          <AppText variant="caption" className="text-content-faint" numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1">
          {isBarbell ? (
            <IconButton
              icon={<Weight size={16} color={colors.contentMuted} />}
              onPress={onOpenPlates}
              variant="plain"
              accessibilityLabel="Plate calculator"
            />
          ) : null}
          <PressableScale
            onPress={() => removeExercise(exercise.id)}
            hitSlop={8}
            accessibilityLabel="Remove exercise"
            className="h-10 w-10 items-center justify-center"
          >
            <X size={16} color={colors.contentFaint} />
          </PressableScale>
        </View>
      </View>

      {rx?.notes ? (
        <PressableScale
          onPress={() => setNotesExpanded((v) => !v)}
          accessibilityLabel={notesExpanded ? 'Collapse plan notes' : 'Expand plan notes'}
          className="flex-row items-start gap-1.5 rounded-lg bg-surface-muted/50 px-2.5 py-2"
        >
          <StickyNote size={12} color={colors.contentFaint} style={{ marginTop: 2 }} />
          <AppText
            variant="caption"
            className="flex-1 text-content-faint"
            numberOfLines={notesExpanded ? undefined : 2}
          >
            {rx.notes}
          </AppText>
        </PressableScale>
      ) : null}

      {/* Column headers */}
      <View className="flex-row items-center gap-2 px-1">
        <AppText variant="label" className="w-8">
          Set
        </AppText>
        <AppText variant="label" className="flex-1 text-center">
          Prev
        </AppText>
        <AppText variant="label" className="w-16 text-center">
          {weightUnitLabel(defaultUnits)}
        </AppText>
        <AppText variant="label" className="w-14 text-center">
          Reps
        </AppText>
        <View className="w-9" />
      </View>

      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          exerciseId={exercise.id}
          set={set}
          isPr={set.completed && prSetIds.has(set.id)}
          celebrate={celebrateSetId === set.id}
          prescription={rx}
          isLatestCompleted={set.id === lastCompletedSetId}
          canDelete={canDeleteSets}
          onToggleWarmup={() => onToggleWarmup(set.id, set.isWarmup)}
          onDelete={() => onDeleteSet(set.id)}
          onOpenActions={() => setActionsSetId(set.id)}
          registerWeightRef={registerWeightRef}
          registerRepsRef={registerRepsRef}
          onFieldFocus={onFieldFocus}
          focusReps={focusReps}
          focusAfter={focusAfter}
        />
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

      {isBarbell ? (
        <PlateCalculatorSheet
          visible={plateSheetOpen}
          onClose={() => setPlateSheetOpen(false)}
          unit={plateUnit}
          onUnitChange={onPlateUnitChange}
          barWeight={plateBarWeight}
          onBarWeightChange={setPlateBarWeight}
          target={plateTarget}
          onTargetChange={setPlateTarget}
        />
      ) : null}

      <BottomSheet
        visible={actionsSet !== null}
        onClose={() => setActionsSetId(null)}
        title={actionsSet ? `Set ${actionsSet.setNumber}` : undefined}
      >
        {actionsSet ? (
          <View className="gap-3">
            <Button
              label={actionsSet.isWarmup ? 'Unmark warmup' : 'Mark as warmup'}
              variant="secondary"
              icon={<Flame size={16} color={colors.accent} />}
              onPress={() => {
                setActionsSetId(null);
                onToggleWarmup(actionsSet.id, actionsSet.isWarmup);
              }}
            />
            {canDeleteSets ? (
              <Button
                label="Delete set"
                variant="danger"
                icon={<Trash2 size={16} color={colors.danger} />}
                onPress={() => {
                  setActionsSetId(null);
                  onDeleteSet(actionsSet.id);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </Card>
  );
}

function SetRow({
  exerciseId,
  set,
  isPr,
  celebrate,
  prescription,
  isLatestCompleted,
  canDelete,
  onToggleWarmup,
  onDelete,
  onOpenActions,
  registerWeightRef,
  registerRepsRef,
  onFieldFocus,
  focusReps,
  focusAfter,
}: {
  exerciseId: string;
  set: ActiveSet;
  isPr: boolean;
  celebrate: boolean;
  prescription: PlanPrescription | null;
  isLatestCompleted: boolean;
  canDelete: boolean;
  onToggleWarmup: () => void;
  onDelete: () => void;
  onOpenActions: () => void;
} & KeyboardFlowProps) {
  const colors = useThemeColors();
  const updateSet = useActiveSessionStore((s) => s.updateSet);
  const toggleSetComplete = useActiveSessionStore((s) => s.toggleSetComplete);

  const swipeableRef = useRef<SwipeableMethods>(null);
  const [rpeExpanded, setRpeExpanded] = useState(false);

  const prScale = useSharedValue(1);
  const prGlow = useSharedValue(0);

  useEffect(() => {
    if (!celebrate) return;
    prScale.value = withSequence(
      withSpring(1.04, { damping: 8, stiffness: 320 }),
      withSpring(1, { damping: 14, stiffness: 260 }),
    );
    prGlow.value = withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 700 }));
  }, [celebrate, prScale, prGlow]);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prScale.value }],
  }));
  const glowAnimatedStyle = useAnimatedStyle(() => ({ opacity: prGlow.value }));

  const prevLabel = set.prev ? `${set.prev.weight ?? '—'} × ${set.prev.reps ?? '—'}` : '—';
  const weightPlaceholder = set.prev?.weight != null ? `${set.prev.weight}` : '0';
  // Real history beats a generic plan target; a free-form target ("AMRAP",
  // "8-12") can never go in a numeric field, so only a bare integer qualifies.
  const repsPlaceholder =
    set.prev?.reps != null
      ? `${set.prev.reps}`
      : prescription && /^\d+$/.test(prescription.targetReps)
        ? prescription.targetReps
        : '0';

  const onToggle = () => {
    fireSetComplete(toggleSetComplete, exerciseId, set.id, set.completed);
  };

  const onRepsSubmit = () => {
    // Submitting reps should complete the set, never un-complete it.
    if (!set.completed) fireSetComplete(toggleSetComplete, exerciseId, set.id, set.completed);
    focusAfter(set.id);
  };

  const onCopyPrev = () => {
    if (!set.prev) return;
    // Deliberately lighter than the set-complete tap — this fills fields
    // without completing the set, so it should feel like a lesser action.
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    updateSet(exerciseId, set.id, { weight: set.prev.weight, reps: set.prev.reps });
  };

  const onRpePress = (value: number) => {
    updateSet(exerciseId, set.id, { rpe: set.rpe === value ? null : value });
  };

  // The weight field keeps its own text so a partial decimal ("22.") survives a
  // render — deriving `value` from the number alone would drop the point and
  // turn 22.5 into 225.
  const [weightText, setWeightText] = useState(() => (set.weight != null ? `${set.weight}` : ''));

  // Resync when the store value changes elsewhere (copy-prev, ghosting). Done
  // during render rather than in an effect so the field never paints the stale
  // number first — this is the field the <3s logging bet runs through.
  // `typed !== set.weight` keeps an in-progress decimal ("22.") from being
  // clobbered by its own round-trip through the store.
  const [syncedWeight, setSyncedWeight] = useState(set.weight);
  if (syncedWeight !== set.weight) {
    setSyncedWeight(set.weight);
    const typed = weightText === '' ? null : Number(weightText.replace(',', '.'));
    if (typed !== set.weight) setWeightText(set.weight != null ? `${set.weight}` : '');
  }

  const onChangeWeight = (text: string) => {
    setWeightText(text);
    updateSet(exerciseId, set.id, {
      weight: text === '' ? null : Number(text.replace(',', '.')) || 0,
    });
  };

  const handleSwipeWarmup = () => {
    swipeableRef.current?.close();
    onToggleWarmup();
  };
  const handleSwipeDelete = () => {
    swipeableRef.current?.close();
    onDelete();
  };

  const rowBg = set.completed ? 'bg-brand/10' : set.isWarmup ? 'bg-surface-muted/40' : '';
  const rowBorder = set.isWarmup ? 'border border-dashed border-content-faint/40' : '';

  const rowContent = (
    <Animated.View
      style={rowAnimatedStyle}
      className={`relative flex-row items-center gap-2 rounded-xl px-1 py-1 ${rowBg} ${rowBorder}`}
    >
      <Animated.View
        pointerEvents="none"
        style={glowAnimatedStyle}
        className="absolute inset-0 rounded-xl bg-brand/30"
      />

      <PressableScale
        onLongPress={onOpenActions}
        hitSlop={6}
        accessibilityLabel={`Set ${set.setNumber} options`}
        className="w-8 items-center justify-center"
      >
        <AppText className="font-bold text-[15px] text-content-muted">{set.setNumber}</AppText>
      </PressableScale>

      {set.prev ? (
        <PressableScale
          onPress={onCopyPrev}
          hitSlop={4}
          accessibilityLabel={`Copy previous set: ${prevLabel}`}
          className="flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-brand/30 bg-brand/10 px-2 py-1.5"
        >
          <Copy size={10} color={colors.brandText} />
          <AppText variant="caption" className="font-semibold text-brand-text">
            {prevLabel}
          </AppText>
        </PressableScale>
      ) : (
        <AppText variant="caption" className="flex-1 text-center">
          {prevLabel}
        </AppText>
      )}

      <TextInput
        ref={(el) => registerWeightRef(set.id, el)}
        value={weightText}
        onChangeText={onChangeWeight}
        onFocus={() => onFieldFocus(set.id, 'weight')}
        onSubmitEditing={() => focusReps(set.id)}
        blurOnSubmit={false}
        returnKeyType="next"
        placeholder={weightPlaceholder}
        placeholderTextColor={colors.contentFaint}
        keyboardType="decimal-pad"
        inputAccessoryViewID={Platform.OS === 'ios' ? SET_ROW_ACCESSORY_ID : undefined}
        className="w-16 rounded-lg bg-surface-muted px-2 py-2 text-center font-bold text-[15px] text-content"
      />

      <TextInput
        ref={(el) => registerRepsRef(set.id, el)}
        value={set.reps != null ? `${set.reps}` : ''}
        onChangeText={(t) =>
          updateSet(exerciseId, set.id, { reps: t ? parseInt(t, 10) || 0 : null })
        }
        onFocus={() => onFieldFocus(set.id, 'reps')}
        onSubmitEditing={onRepsSubmit}
        blurOnSubmit={false}
        returnKeyType="done"
        placeholder={repsPlaceholder}
        placeholderTextColor={colors.contentFaint}
        keyboardType="number-pad"
        inputAccessoryViewID={Platform.OS === 'ios' ? SET_ROW_ACCESSORY_ID : undefined}
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
        <Check size={16} color={set.completed ? BRAND_FG : colors.contentFaint} strokeWidth={3} />
      </PressableScale>
    </Animated.View>
  );

  const expanded = isLatestCompleted || rpeExpanded;
  // Every completed set keeps an RPE affordance — rating a set after finishing
  // the whole exercise is normal, so a collapsed row must still be openable.
  const showSecondaryRow = isPr || set.completed;

  return (
    <View className="gap-1.5">
      {Platform.OS !== 'web' ? (
        <Swipeable
          ref={swipeableRef}
          overshootRight={false}
          renderRightActions={(progress) => (
            <SwipeActions
              progress={progress}
              isWarmup={set.isWarmup}
              canDelete={canDelete}
              onWarmup={handleSwipeWarmup}
              onDelete={handleSwipeDelete}
              colors={colors}
            />
          )}
        >
          {rowContent}
        </Swipeable>
      ) : (
        rowContent
      )}

      {showSecondaryRow ? (
        <View className="flex-row flex-wrap items-center gap-2 px-1">
          {isPr ? (
            <View className="flex-row items-center gap-1">
              <Award size={11} color={colors.brandText} />
              <Badge label="PR" tone="brand" />
            </View>
          ) : null}
          {set.completed ? (
            expanded ? (
              <Animated.View
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(150)}
                className="flex-row items-center gap-1.5"
              >
                <AppText variant="caption" className="mr-0.5">
                  RPE
                </AppText>
                {RPE_VALUES.map((v) => (
                  <Chip
                    key={v}
                    compact
                    label={String(v)}
                    selected={set.rpe === v}
                    onPress={() => onRpePress(v)}
                  />
                ))}
              </Animated.View>
            ) : (
              <PressableScale
                onPress={() => setRpeExpanded(true)}
                hitSlop={6}
                accessibilityLabel={set.rpe != null ? `RPE ${set.rpe}, tap to edit` : 'Rate RPE'}
              >
                {set.rpe != null ? (
                  <Badge label={`RPE ${set.rpe}`} />
                ) : (
                  <AppText variant="caption" className="text-content-faint">
                    + RPE
                  </AppText>
                )}
              </PressableScale>
            )
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SwipeActions({
  progress,
  isWarmup,
  canDelete,
  onWarmup,
  onDelete,
  colors,
}: {
  progress: SharedValue<number>;
  isWarmup: boolean;
  canDelete: boolean;
  onWarmup: () => void;
  onDelete: () => void;
  colors: ThemeColors;
}) {
  // Fades in with the swipe rather than snapping in at full opacity.
  const style = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1) }));

  return (
    <Animated.View style={style} className="flex-row items-stretch gap-2 pl-2">
      <PressableScale
        onPress={onWarmup}
        accessibilityLabel={isWarmup ? 'Unmark warmup set' : 'Mark warmup set'}
        className="w-[72px] items-center justify-center gap-1 rounded-xl bg-accent/15"
      >
        <Flame size={16} color={colors.accent} />
        <AppText variant="caption" className="font-semibold text-accent">
          {isWarmup ? 'Unwarm' : 'Warmup'}
        </AppText>
      </PressableScale>
      {canDelete ? (
        <PressableScale
          onPress={onDelete}
          accessibilityLabel="Delete set"
          className="w-[72px] items-center justify-center gap-1 rounded-xl bg-danger/15"
        >
          <Trash2 size={16} color={colors.danger} />
          <AppText variant="caption" className="font-semibold text-danger">
            Delete
          </AppText>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

function PlateCalculatorSheet({
  visible,
  onClose,
  unit,
  onUnitChange,
  barWeight,
  onBarWeightChange,
  target,
  onTargetChange,
}: {
  visible: boolean;
  onClose: () => void;
  unit: PlateUnit;
  onUnitChange: (unit: PlateUnit) => void;
  barWeight: number;
  onBarWeightChange: (weight: number) => void;
  target: number;
  onTargetChange: (weight: number) => void;
}) {
  const result = calcPlateLoad(target, barWeight, PLATES[unit]);
  // Loaded per side; jumping by one plate on each side moves the total by 2x.
  const step = Math.min(...PLATES[unit]) * 2;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Plate calculator">
      <View className="gap-4">
        <SegmentedControl
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          value={unit}
          onChange={onUnitChange}
        />

        <View className="gap-1.5">
          <AppText variant="label">Bar</AppText>
          <SegmentedControl
            options={BAR_WEIGHTS[unit].map((w) => ({ value: String(w), label: `${w} ${unit}` }))}
            value={String(barWeight)}
            onChange={(v) => onBarWeightChange(Number(v))}
          />
        </View>

        <View className="items-center gap-1">
          <AppText variant="label">Target</AppText>
          <NumberStepper
            value={target}
            onChange={onTargetChange}
            step={step}
            max={1000}
            format={(v) => `${v} ${unit}`}
          />
        </View>

        <View className="gap-2 rounded-2xl bg-surface-muted p-3">
          <AppText variant="label">Per side</AppText>
          {result.perSide.length > 0 ? (
            <View className="flex-row flex-wrap items-center gap-1.5">
              {result.perSide.map((plate, i) => (
                <View key={i} className="flex-row items-center gap-1.5">
                  {i > 0 ? (
                    <AppText variant="caption" className="text-content-faint">
                      +
                    </AppText>
                  ) : null}
                  <Badge label={`${plate}`} />
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="caption">Bar only</AppText>
          )}
          {result.diff !== 0 ? (
            <AppText variant="caption" className="text-warning">
              {target} {unit} can&apos;t be loaded exactly with these plates — closest is{' '}
              {result.loadedTotal} {unit}.
            </AppText>
          ) : (
            <AppText variant="caption">
              Loads exactly at {result.loadedTotal} {unit}.
            </AppText>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}
