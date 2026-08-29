import { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeOut, SlideInUp } from 'react-native-reanimated';
import { Award, Check, TriangleAlert } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import { durations, springs } from '@/lib/motion';
import { palette, useThemeColors } from '@/lib/theme';
import { useToastStore, type ToastTone } from '@/lib/toastStore';
import { AppText } from './Text';
import { PressableScale } from './PressableScale';

/**
 * Renders the single active toast from `lib/toastStore`, top-anchored so it
 * never fights the keyboard. Mounted once in the root layout, above the
 * navigator. Known limit: RN `Modal`s render above this host — close sheets
 * before firing a toast.
 */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toast) AccessibilityInfo.announceForAccessibility(toast.message);
  }, [toast]);

  if (!toast) return null;

  // The toast sits on `bg-content` — the *inverse* surface — so its accents
  // must come from the opposite scheme's palette. Using the current scheme's
  // brand here paints lime on near-white in dark mode.
  const inverse = palette[colors.scheme === 'dark' ? 'light' : 'dark'];

  const icons: Record<ToastTone, React.ReactNode> = {
    default: null,
    success: <Check size={16} color={inverse.brandText} strokeWidth={3} />,
    pr: <Award size={16} color={inverse.brandText} />,
    warning: <TriangleAlert size={16} color={inverse.warning} />,
  };

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-5 right-5 z-50"
      style={{ top: insets.top + 8 }}
    >
      <Animated.View
        // Keyed by id so a replacement toast re-runs the entrance.
        key={toast.id}
        entering={SlideInUp.springify()
          .damping(springs.sheet.damping)
          .stiffness(springs.sheet.stiffness)}
        exiting={FadeOut.duration(durations.exit)}
        // box-none, not the default: the toast overlays screen chrome (the
        // logger's Finish button sits right under it), and a passive banner
        // must never eat taps meant for what's behind it. Only the action
        // button below opts back into receiving touches.
        pointerEvents="box-none"
        className="flex-row items-center gap-2 rounded-2xl bg-content px-4 py-3"
      >
        {icons[toast.tone]}
        <AppText className="flex-1 font-bold text-[13px]" color="text-surface">
          {toast.message}
        </AppText>
        {toast.action ? (
          <PressableScale
            onPress={() => {
              haptics.tap();
              dismiss();
              toast.action?.onPress();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={toast.action.label}
            className="rounded-lg px-2 py-1"
          >
            {/* `color` drops the variant default so exactly one color class
                lands; the inline style then supplies the inverse accent and
                degrades to a readable text-surface if it ever loses. */}
            <AppText
              className="font-bold text-[13px]"
              color="text-surface"
              style={{ color: inverse.brandText }}
            >
              {toast.action.label}
            </AppText>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}
