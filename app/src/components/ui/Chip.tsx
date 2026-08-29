import { haptics } from '@/lib/haptics';
import { pressScale } from '@/lib/motion';
import { AppText } from './Text';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Equal-width pill for short numeric labels, so a row of them lines up. */
  compact?: boolean;
  disabled?: boolean;
}

/** Selectable filter pill (muscle groups, goals, meal pickers…). */
export function Chip({ label, selected, onPress, compact, disabled }: ChipProps) {
  return (
    <PressableScale
      onPress={
        onPress
          ? () => {
              haptics.selection();
              onPress();
            }
          : undefined
      }
      disabled={disabled}
      scaleTo={pressScale.chip}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      // Pills are ~34–36pt tall; the slop tops them up to the 44pt minimum.
      hitSlop={{ top: 5, bottom: 5 }}
      className={`items-center justify-center rounded-full border ${
        compact ? 'h-9 min-w-9 px-2' : 'px-4 py-2'
      } ${selected ? 'border-brand bg-brand' : 'border-surface-muted bg-surface-elevated'} ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <AppText
        variant="caption"
        className="font-semibold"
        color={selected ? 'text-brand-fg' : 'text-content-muted'}
      >
        {label}
      </AppText>
    </PressableScale>
  );
}
