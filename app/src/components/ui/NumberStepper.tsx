import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
// Round to the step's precision to dodge float drift (0.1 + 0.2 …).
const round = (n: number) => Math.round(n * 100) / 100;

/** − value + control for servings, age, plate increments, etc. Value is also keyboard-editable. */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  format,
}: NumberStepperProps) {
  const colors = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));

  // Keep the field in sync with external value changes (e.g. +/- taps) while not editing.
  useEffect(() => {
    if (!editing) setText(String(value));
  }, [value, editing]);

  const adjust = (delta: number) => {
    const next = round(value + delta);
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
    const next = clamp(round(parsed), min, max);
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
        keyboardType="decimal-pad"
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
