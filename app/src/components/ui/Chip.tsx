import { Text } from 'react-native';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Selectable filter pill (muscle groups, goals, meal pickers…). */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected ? 'border-brand bg-brand' : 'border-surface-muted bg-surface-elevated'
      }`}
    >
      <Text
        className={`font-semibold text-[13px] ${selected ? 'text-brand-fg' : 'text-content-muted'}`}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
