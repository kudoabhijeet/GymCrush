import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useThemeColors } from '@/lib/theme';
import { PressableScale } from './PressableScale';

interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Formats the displayed value, e.g. (v) => `${v}g`. */
  format?: (value: number) => string;
  /**
   * Roll over at the ends instead of stopping there — stepping past `max`
   * lands on `min` and vice versa. For cyclic values like an hour of the day.
   */
  wrap?: boolean;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
// Round to the step's precision to dodge float drift (0.1 + 0.2 …).
const round = (n: number) => Math.round(n * 100) / 100;
// Folds n into [min, max] inclusive, so 24 -> 0 and -1 -> 23 for an hour.
// Rounds first: a cyclic range is a whole-number one, and the span arithmetic
// below is only meaningful over integers.
const wrapInto = (n: number, min: number, max: number) => {
  const span = max - min + 1;
  return (((Math.round(n) - min) % span) + span) % span + min;
};

/** − value + control for servings, age, plate increments, etc. Value is also keyboard-editable. */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  format,
  wrap = false,
}: NumberStepperProps) {
  const colors = useThemeColors();
  const [editing, setEditing] = useState(false);
  // Only read while `editing`; `onFocus` seeds it from the current value, so it
  // needs no separate sync for external changes (+/- taps, a preset chip).
  const [text, setText] = useState(String(value));

  const adjust = (delta: number) => {
    const next = round(value + delta);
    if (wrap) {
      onChange(wrapInto(next, min, max));
      return;
    }
    if (next < min || next > max) return;
    onChange(next);
  };

  const commit = () => {
    setEditing(false);
    const parsed = Number(text.replace(',', '.'));
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const next = wrap ? wrapInto(round(parsed), min, max) : clamp(round(parsed), min, max);
    setText(String(next));
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
      <TextInput
        value={editing ? text : format ? format(value) : String(value)}
        onFocus={() => {
          setEditing(true);
          setText(String(value));
        }}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        selectTextOnFocus
        keyboardType={wrap ? 'number-pad' : 'decimal-pad'}
        returnKeyType="done"
        accessibilityLabel="Value"
        className="min-w-[56px] text-center font-extrabold text-lg text-content"
      />
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
