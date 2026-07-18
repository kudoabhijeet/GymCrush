import { Minus, Plus } from 'lucide-react-native';
import { View } from 'react-native';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';
import { PressableScale } from './PressableScale';

interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Formats the displayed value, e.g. (v) => `${v}g`. */
  format?: (value: number) => string;
}

/** − value + control for servings, age, plate increments, etc. */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  format,
}: NumberStepperProps) {
  const colors = useThemeColors();

  const adjust = (delta: number) => {
    // Round to the step's precision to dodge float drift (0.1 + 0.2 …).
    const next = Math.round((value + delta) * 100) / 100;
    if (next < min || next > max) return;
    onChange(next);
  };

  return (
    <View className="flex-row items-center gap-4">
      <PressableScale
        onPress={() => adjust(-step)}
        scaleTo={0.88}
        hitSlop={6}
        accessibilityLabel="Decrease"
        className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted"
      >
        <Minus size={16} color={colors.content} strokeWidth={2.5} />
      </PressableScale>
      <AppText className="min-w-[56px] text-center font-extrabold text-lg text-content">
        {format ? format(value) : value}
      </AppText>
      <PressableScale
        onPress={() => adjust(step)}
        scaleTo={0.88}
        hitSlop={6}
        accessibilityLabel="Increase"
        className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted"
      >
        <Plus size={16} color={colors.content} strokeWidth={2.5} />
      </PressableScale>
    </View>
  );
}
