import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { durations } from '@/lib/motion';

interface ProgressBarProps {
  /** 0..1; values > 1 are clamped to a full bar and the fill turns accent. */
  progress: number;
  /** Tailwind bg-* class for the fill. Default brand; over-target overrides to accent. */
  fillClassName?: string;
  height?: number;
  /** What the bar measures, for screen readers — e.g. "Protein". */
  accessibilityLabel?: string;
}

export function ProgressBar({
  progress,
  fillClassName = 'bg-brand',
  height = 8,
  accessibilityLabel,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const over = progress > 1;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: durations.sweep });
  }, [clamped, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      className="w-full overflow-hidden rounded-full bg-surface-muted"
      style={{ height }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        className={`h-full rounded-full ${over ? 'bg-accent' : fillClassName}`}
        style={fillStyle}
      />
    </View>
  );
}
