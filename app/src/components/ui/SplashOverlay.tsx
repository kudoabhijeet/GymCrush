import Animated, { FadeIn } from 'react-native-reanimated';
import { durations } from '@/lib/motion';
import { AppText } from './Text';

/**
 * Fills the gap between the native splash (app.json `splash.backgroundColor`,
 * shown before JS runs) and the app UI mounting. Same near-black fill
 * (bg-brand-fg = #0a0c0b, matching app.json) so the handoff from native to JS
 * splash is invisible — only the "GymCrush" wordmark fades in.
 */
export function SplashOverlay() {
  return (
    <Animated.View className="flex-1 items-center justify-center bg-brand-fg">
      <Animated.View entering={FadeIn.duration(durations.enter)}>
        <AppText variant="display" color="text-brand">
          GymCrush
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}
