import { useEffect, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { PressableScale } from '@/components/ui/PressableScale';

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/**
 * Android's answer to the iOS InputAccessoryView: numeric keyboards there have
 * no Return key, so without this bar there is no way to auto-advance
 * weight -> reps -> next set. Rendered as the last child of the screen's flex
 * column; adjustResize shrinks the window, pinning it right above the keyboard.
 */
export function SetAdvanceBar({ onNext }: { onNext: () => void }) {
  const visible = useKeyboardVisible();
  if (!visible) return null;

  return (
    <View className="flex-row justify-end border-t border-surface-muted bg-surface-elevated px-4 py-2">
      <PressableScale
        onPress={onNext}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Next field"
        className="px-2 py-1"
      >
        <AppText className="font-bold text-[15px] text-brand-text">Next</AppText>
      </PressableScale>
    </View>
  );
}
