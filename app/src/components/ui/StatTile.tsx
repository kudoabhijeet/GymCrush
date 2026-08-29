import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from './Text';
import { Card } from './Card';

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
    // `accessible` merges the tile into one announcement: "label, value unit".
    <Card className="flex-1 gap-1.5" accessible>
      <View className="flex-row items-center gap-1.5">
        {icon}
        <AppText variant="label">{label}</AppText>
      </View>
      <View className="flex-row items-baseline gap-1">
        <AppText variant="stat">{value}</AppText>
        {unit ? <AppText variant="caption">{unit}</AppText> : null}
      </View>
    </Card>
  );
}
