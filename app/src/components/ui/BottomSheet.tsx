import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { AppText } from './Text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Lightweight bottom sheet: RN Modal + Reanimated entering/exiting animations.
 * Tap the backdrop or drag indicator area to dismiss.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} className="absolute inset-0">
          <Pressable className="flex-1 bg-black/50" onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(240)}
          exiting={SlideOutDown.duration(180)}
          className="rounded-t-3xl bg-surface-elevated px-5 pt-2"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-3 items-center py-2">
            <View className="h-1 w-10 rounded-full bg-surface-muted" />
          </View>
          {title ? (
            <AppText variant="heading" className="mb-4">
              {title}
            </AppText>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
