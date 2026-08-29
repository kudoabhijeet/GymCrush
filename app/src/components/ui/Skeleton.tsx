import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { durations } from '@/lib/motion';

/**
 * Pulsing placeholder block shown while queries load. Hidden from screen
 * readers — a loading shimmer is noise to them — and static under reduce-motion.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: durations.pulse }),
        withTiming(0.5, { duration: durations.pulse }),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`bg-surface-muted ${className}`}
      style={style}
    />
  );
}

/**
 * The standard loading stanza — a column of pulsing rows. Replaces the
 * copy-pasted three-Skeleton blocks on list screens.
 */
export function SkeletonList({
  rows = 3,
  rowClassName = 'h-20 rounded-2xl',
}: {
  rows?: number;
  /** Size/shape of each row, e.g. `h-32 rounded-2xl` for card-shaped rows. */
  rowClassName?: string;
}) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </View>
  );
}
