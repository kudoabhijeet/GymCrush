import { Switch, type SwitchProps } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';

/**
 * RN Switch pre-wired with theme colors and the selection haptic, so screens
 * stop re-deriving trackColor/thumbColor from useThemeColors by hand.
 */
export function AppSwitch({ onValueChange, ...rest }: SwitchProps) {
  const colors = useThemeColors();
  return (
    <Switch
      trackColor={{ false: colors.surfaceMuted, true: colors.brand }}
      ios_backgroundColor={colors.surfaceMuted}
      thumbColor={colors.surfaceElevated}
      onValueChange={(v) => {
        haptics.selection();
        onValueChange?.(v);
      }}
      {...rest}
    />
  );
}
