import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-brand'
      : 'border-surface-muted';

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-content-muted">{label}</Text>
      <TextInput
        placeholderTextColor="#5d6a67"
        selectionColor="#ccff00"
        className={`rounded-xl border bg-surface-elevated px-4 py-3.5 text-base text-content ${borderClass}`}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
