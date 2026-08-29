import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, TextInput, View, type TextInputProps } from 'react-native';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Optional lucide icon rendered inside the field, left of the text. */
  leftIcon?: ReactNode;
}

export function TextField({
  label,
  error,
  leftIcon,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...rest
}: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  // Android announces the error via the live region below; iOS has no live
  // regions, so the transition is announced imperatively.
  useEffect(() => {
    if (error && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-brand-text'
      : 'border-surface-muted';

  return (
    <View className="gap-2">
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <View
        className={`flex-row items-center gap-3 rounded-xl border bg-surface-elevated px-4 ${borderClass}`}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.contentFaint}
          selectionColor={colors.scheme === 'dark' ? colors.brand : colors.brandText}
          // The visual label isn't programmatically associated in RN, so it
          // (and any error) is composed into the input's own label.
          accessibilityLabel={accessibilityLabel ?? (label && error ? `${label}, ${error}` : label)}
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
      {error ? (
        <AppText variant="caption" color="text-danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
