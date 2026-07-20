import { View } from 'react-native';
import { AppText } from './Text';

/**
 * Fills the gap between the native splash (app.json `splash.backgroundColor`,
 * shown before JS runs) and the app UI mounting. Same brand-lime fill so the
 * handoff from native to JS splash is invisible — only the "GymCrush"
 * wordmark fades in.
 */
export function SplashOverlay() {
  return (
    <View className="flex-1 items-center justify-center bg-brand">
      <AppText variant="display" color="text-brand-fg">
        GymCrush
      </AppText>
    </View>
  );
}
