import { useEffect, type ReactNode } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { durations, springs } from '@/lib/motion';
import { AppText } from './Text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Drag distance / fling velocity past which the sheet dismisses. */
const DISMISS_DRAG_PX = 120;
const DISMISS_VELOCITY = 800;
/** Upward rubber-band softens as the finger travels further above rest. */
const UPWARD_REST_PX = 120;
/** Past this offset the sheet is considered off-screen and we unmount. */
const OFFSCREEN_Y = Dimensions.get('window').height;

/**
 * Lightweight bottom sheet: RN Modal + Reanimated entering/exiting animations.
 * Tap the backdrop or drag the sheet down to dismiss. Content with inputs is
 * kept above the keyboard on iOS (Android's adjustResize handles it natively).
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const dismissing = useSharedValue(false);

  // Reset any leftover drag offset each time the sheet opens.
  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      dismissing.value = false;
    }
  }, [visible, translateY, dismissing]);

  const finishClose = () => {
    onClose();
  };

  const pan = Gesture.Pan()
    // Vertical intent only — horizontal swipes (and plain taps) pass through
    // to the sheet's content untouched.
    .activeOffsetY([-12, 12])
    .onUpdate((e) => {
      if (dismissing.value) return;
      // Free downward; diminishing resistance upward (rubber-band).
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      } else {
        const ty = -e.translationY;
        translateY.value = -(ty / (1 + ty / UPWARD_REST_PX));
      }
    })
    .onEnd((e) => {
      if (dismissing.value) return;
      if (e.translationY > DISMISS_DRAG_PX || e.velocityY > DISMISS_VELOCITY) {
        dismissing.value = true;
        translateY.value = withSpring(
          OFFSCREEN_Y,
          { ...springs.sheetSettle, velocity: e.velocityY },
          (finished) => {
            if (finished) runOnJS(finishClose)();
          },
        );
      } else {
        translateY.value = withSpring(0, {
          ...springs.sheetSettle,
          velocity: e.velocityY,
        });
      }
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* RN Modal mounts a fresh native root, so gesture-handler needs its own
          root view inside it — without this the pan gesture is inert on Android. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View
            entering={FadeIn.duration(durations.enter)}
            exiting={FadeOut.duration(durations.exit)}
            className="absolute inset-0"
          >
            <Pressable
              className="flex-1 bg-black/50"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            />
          </Animated.View>
          <GestureDetector gesture={pan}>
            <Animated.View
              entering={SlideInDown.springify()
                .damping(springs.sheetSettle.damping)
                .stiffness(springs.sheetSettle.stiffness)
                .mass(springs.sheetSettle.mass)}
              exiting={SlideOutDown.duration(durations.exit)}
              style={dragStyle}
              className="rounded-t-3xl bg-surface-elevated px-5 pt-2"
            >
              <View style={{ paddingBottom: insets.bottom + 20 }}>
                <View className="mb-3 items-center py-2">
                  <View className="h-1 w-10 rounded-full bg-surface-muted" />
                </View>
                {title ? (
                  <AppText variant="heading" className="mb-4">
                    {title}
                  </AppText>
                ) : null}
                {children}
              </View>
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
