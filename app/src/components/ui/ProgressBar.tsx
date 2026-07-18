import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ProgressBarProps {
  /** 0..1; values > 1 are clamped (over-target shows full + accent color). */
  progress: number;
  /** Tailwind bg-* class for the fill. Default brand. */
  fillClassName?: string;
  height?: number;
}

export function ProgressBar({ progress, fillClassName = 'bg-brand', height = 8 }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 600 });
  }, [clamped, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      className="w-full overflow-hidden rounded-full bg-surface-muted"
      style={{ height }}
      accessibilityRole="progressbar"
    >
      <Animated.View className={`h-full rounded-full ${fillClassName}`} style={fillStyle} />
    </View>
  );
}
