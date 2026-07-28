import { cssInterop } from 'nativewind';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// NativeWind doesn't auto-register Reanimated-wrapped components for className->style
// interop, so without this the padding/sizing classes never become real hitbox/layout —
// only a plain-Text child inside would render, making the button tappable only on its label.
cssInterop(AnimatedPressable, { className: 'style' });

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
