import { Text } from 'react-native';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Equal-width pill for short numeric labels, so a row of them lines up. */
  compact?: boolean;
}

/** Selectable filter pill (muscle groups, goals, meal pickers…). */
export function Chip({ label, selected, onPress, compact }: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      className={`items-center justify-center rounded-full border ${
        compact ? 'h-9 min-w-9 px-2' : 'px-4 py-2'
      } ${selected ? 'border-brand bg-brand' : 'border-surface-muted bg-surface-elevated'}`}
    >
      <Text
        className={`font-semibold text-[13px] ${selected ? 'text-brand-fg' : 'text-content-muted'}`}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
