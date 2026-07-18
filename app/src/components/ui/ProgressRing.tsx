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
}

export function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 12,
  color,
  delay = 0,
  children,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withDelay(
      delay,
      withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [clamped, delay, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
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
