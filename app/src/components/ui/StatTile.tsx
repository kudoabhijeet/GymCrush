import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from './Text';

interface StatTileProps {
  label: string;
  value: string;
  /** Small suffix after the value, e.g. "kg". */
  unit?: string;
  icon?: ReactNode;
}

/** Compact stat block: label on top, big Figtree number below. */
export function StatTile({ label, value, unit, icon }: StatTileProps) {
  return (
    <View className="flex-1 gap-1.5 rounded-2xl border border-surface-muted bg-surface-elevated p-4">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <AppText variant="label">{label}</AppText>
      </View>
      <View className="flex-row items-baseline gap-1">
        <AppText className="font-extrabold text-[22px] leading-7 text-content">{value}</AppText>
        {unit ? <AppText variant="caption">{unit}</AppText> : null}
      </View>
    </View>
  );
}
