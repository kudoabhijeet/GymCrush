import { memo, useEffect, useRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { Award, Check, Copy } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { haptics } from '@/lib/haptics';
import { durations, pressScale, springs } from '@/lib/motion';
import { BRAND_FG, useThemeColors } from '@/lib/theme';
import { useActiveSessionStore, type ActiveSet, type PlanPrescription } from '../activeSessionStore';
import { fireSetComplete, SET_ROW_ACCESSORY_ID, type SetFocusFlow } from '../useSetFocusFlow';
import { SwipeActions } from './SwipeActions';

/** RPE is rated after the set, so the picker only makes sense post-completion. */
const RPE_VALUES = [6, 7, 8, 9, 10] as const;

interface SetRowProps {
  exerciseId: string;
  set: ActiveSet;
  isPr: boolean;
  celebrate: boolean;
  prescription: PlanPrescription | null;
  isLatestCompleted: boolean;
  canDelete: boolean;
  /** Id-based and stable in the parent, so memoization actually holds. */
  onToggleWarmup: (setId: string, isWarmup: boolean) => void;
  onDelete: (setId: string) => void;
  onOpenActions: (setId: string) => void;
  flow: SetFocusFlow;
}

/**
 * One set row. Memoized — with a 6-exercise session this is the hottest
 * component on the screen, and it must not re-render on the timer tick or on
 * edits to other sets. All props are primitives, stable callbacks, or the
 * `set` object (replaced by the store only when this set changes).
 */
export const SetRow = memo(function SetRow({
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
  flow,
}: SetRowProps) {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();

  const swipeableRef = useRef<SwipeableMethods>(null);
  const [rpeExpanded, setRpeExpanded] = useState(false);

  const prScale = useSharedValue(1);
  const prGlow = useSharedValue(0);

  useEffect(() => {
    if (!celebrate || reduceMotion) return;
    prScale.value = withSequence(withSpring(1.04, springs.pop), withSpring(1, springs.settle));
    prGlow.value = withSequence(
      withTiming(1, { duration: durations.enter }),
      withTiming(0, { duration: durations.glow }),
    );
  }, [celebrate, reduceMotion, prScale, prGlow]);

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
    fireSetComplete(exerciseId, set.id, set.completed);
  };

  const onRepsSubmit = () => {
    // Submitting reps should complete the set, never un-complete it.
    if (!set.completed) fireSetComplete(exerciseId, set.id, set.completed);
    flow.focusAfter(set.id);
  };

  const onCopyPrev = () => {
    if (!set.prev) return;
    // Deliberately lighter than the set-complete tap — this fills fields
    // without completing the set, so it should feel like a lesser action.
    haptics.selection();
    useActiveSessionStore
      .getState()
      .updateSet(exerciseId, set.id, { weight: set.prev.weight, reps: set.prev.reps });
  };

  const onRpePress = (value: number) => {
    useActiveSessionStore
      .getState()
      .updateSet(exerciseId, set.id, { rpe: set.rpe === value ? null : value });
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
    useActiveSessionStore.getState().updateSet(exerciseId, set.id, {
      weight: text === '' ? null : Number(text.replace(',', '.')) || 0,
    });
  };

  const handleSwipeWarmup = () => {
    swipeableRef.current?.close();
    onToggleWarmup(set.id, set.isWarmup);
  };
  const handleSwipeDelete = () => {
    swipeableRef.current?.close();
    onDelete(set.id);
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
        onLongPress={() => onOpenActions(set.id)}
        hitSlop={6}
        accessibilityLabel={`Set ${set.setNumber} options`}
        className="w-8 self-stretch items-center justify-center"
      >
        <AppText className="font-bold text-[15px] text-content-muted">{set.setNumber}</AppText>
      </PressableScale>

      {set.prev ? (
        <PressableScale
          onPress={onCopyPrev}
          hitSlop={8}
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
        ref={(el) => flow.registerWeightRef(set.id, el)}
        value={weightText}
        onChangeText={onChangeWeight}
        onFocus={() => flow.onFieldFocus(set.id, 'weight')}
        onSubmitEditing={() => flow.focusReps(set.id)}
        blurOnSubmit={false}
        returnKeyType="next"
        placeholder={weightPlaceholder}
        placeholderTextColor={colors.contentFaint}
        keyboardType="decimal-pad"
        inputAccessoryViewID={Platform.OS === 'ios' ? SET_ROW_ACCESSORY_ID : undefined}
        // 44pt tall — this and reps are the most-tapped inputs in the app.
        style={{ textAlignVertical: 'center' }}
        className="h-11 w-16 rounded-lg bg-surface-muted px-2 py-0 text-center font-bold text-[15px] text-content"
      />

      <TextInput
        ref={(el) => flow.registerRepsRef(set.id, el)}
        value={set.reps != null ? `${set.reps}` : ''}
        onChangeText={(t) =>
          useActiveSessionStore
            .getState()
            .updateSet(exerciseId, set.id, { reps: t ? parseInt(t, 10) || 0 : null })
        }
        onFocus={() => flow.onFieldFocus(set.id, 'reps')}
        onSubmitEditing={onRepsSubmit}
        blurOnSubmit={false}
        returnKeyType="done"
        placeholder={repsPlaceholder}
        placeholderTextColor={colors.contentFaint}
        keyboardType="number-pad"
        inputAccessoryViewID={Platform.OS === 'ios' ? SET_ROW_ACCESSORY_ID : undefined}
        style={{ textAlignVertical: 'center' }}
        className="h-11 w-14 rounded-lg bg-surface-muted px-2 py-0 text-center font-bold text-[15px] text-content"
      />
      <PressableScale
        onPress={onToggle}
        scaleTo={pressScale.stamp}
        accessibilityRole="button"
        accessibilityState={{ selected: set.completed }}
        accessibilityLabel={set.completed ? 'Mark set incomplete' : 'Complete set'}
        // 44pt — the single most-tapped target in the app.
        className={`h-11 w-11 items-center justify-center rounded-xl ${
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
                entering={FadeIn.duration(durations.enter)}
                exiting={FadeOut.duration(durations.exit)}
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
});
