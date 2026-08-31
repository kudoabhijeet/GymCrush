import { cssInterop } from 'nativewind';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { durations, pressScale, springs } from '@/lib/motion';

// NativeWind doesn't auto-register Reanimated-wrapped components for className->style
// interop, so without registering it the padding/sizing classes never become real
// hitbox/layout — only a plain-Text child inside would render, making the button
// tappable only on its label.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  /** Scale when pressed — pass a named depth from `pressScale`. Default `pressScale.button`. */
  scaleTo?: number;
  className?: string;
}

interface PressableScaleInnerProps extends PressableScaleProps {
  cssStyle?: object;
}

// Mapping className straight to `style` (the obvious approach) resolves className
// into the `style` prop by fully replacing it rather than merging — cssInterop
// does `{ ...props, ...possiblyAnimatedProps }` internally, so the resolved
// className style clobbers whatever was already in `style`, stripping the
// Reanimated scale transform below. See nativewind/nativewind#957. Routing
// className to this dedicated `cssStyle` prop and merging it into the style
// array ourselves avoids the clobber.
function PressableScaleInner({
  scaleTo = pressScale.button,
  onPressIn,
  onPressOut,
  style,
  cssStyle,
  ...rest
}: PressableScaleInnerProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      style={[cssStyle, animatedStyle, style as object]}
      onPressIn={(e) => {
        scale.set(withTiming(scaleTo, { duration: durations.press }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, springs.press));
        onPressOut?.(e);
      }}
      {...rest}
    />
  );
}

cssInterop(PressableScaleInner, { className: 'cssStyle' });

/**
 * Pressable with a spring scale-down on press. Reanimated drives `style`
 * (never className) — className stays for static NativeWind styles.
 */
export function PressableScale(props: PressableScaleProps) {
  return <PressableScaleInner {...props} />;
}
