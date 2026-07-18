import { useState, type ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColors } from '@/lib/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Optional lucide icon rendered inside the field, left of the text. */
  leftIcon?: ReactNode;
}

export function TextField({ label, error, leftIcon, onFocus, onBlur, ...rest }: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-brand-text'
      : 'border-surface-muted';

  return (
    <View className="gap-2">
      {label ? (
        <Text className="font-medium text-sm text-content-muted">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center gap-3 rounded-xl border bg-surface-elevated px-4 ${borderClass}`}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.contentFaint}
          selectionColor={colors.scheme === 'dark' ? colors.brand : colors.brandText}
          className="flex-1 py-3.5 font-body text-base text-content"
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
      </View>
      {error ? <Text className="font-medium text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
