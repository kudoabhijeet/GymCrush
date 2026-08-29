import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { durations } from '@/lib/motion';
import { useThemeColors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0..1; clamped. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Ring color; defaults to brand volt. */
  color?: string;
  /** Delay before the fill animates in (ms) — used for staggered reveals. */
  delay?: number;
  /** Center content (numbers, labels). */
  children?: ReactNode;
  /** What the ring measures, for screen readers — e.g. "Calories". */
  accessibilityLabel?: string;
}

export function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 12,
  color,
  delay = 0,
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withDelay(
      delay,
      withTiming(clamped, { duration: durations.ringSweep, easing: Easing.out(Easing.cubic) }),
    );
  }, [clamped, delay, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
      // With a label the ring + its center content announce as one element;
      // without one it stays a plain container so children remain reachable.
      accessible={accessibilityLabel != null}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel != null ? 'progressbar' : undefined}
      accessibilityValue={
        accessibilityLabel != null
          ? { min: 0, max: 100, now: Math.round(clamped * 100) }
          : undefined
      }
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceMuted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Fill — rotated so it starts at 12 o'clock */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color ?? colors.brand}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
