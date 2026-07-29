import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Don't register this with NativeWind's `cssInterop`. The interop resolves
// `className` into the `style` prop, which then loses to the animated `style`
// passed below — buttons render with their padding, radius and background
// stripped, and some lose their children entirely. NativeWind already handles
// `className` here on its own.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  /** Scale when pressed. Default 0.97 — subtle, production feel. */
  scaleTo?: number;
  className?: string;
}

/**
 * Pressable with a spring scale-down on press. Reanimated drives `style`
 * (never className) — className stays for static NativeWind styles.
 */
export function PressableScale({
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[animatedStyle, style as object]}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 80 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 300 });
        onPressOut?.(e);
      }}
      {...rest}
    />
  );
}
