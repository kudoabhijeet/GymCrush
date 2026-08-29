import type { ReactNode } from 'react';
import { ActivityIndicator, View, type PressableProps } from 'react-native';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Optional lucide icon rendered before the label. */
  icon?: ReactNode;
}

const containerVariants: Record<Variant, string> = {
  primary: 'bg-brand',
  secondary: 'bg-surface-muted',
  ghost: 'bg-transparent',
  danger: 'bg-danger/10',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-brand-fg',
  secondary: 'text-content',
  ghost: 'text-content-muted',
  danger: 'text-danger',
};

const containerSizes: Record<Size, string> = {
  sm: 'px-4 py-2.5 rounded-xl',
  md: 'px-5 py-3.5 rounded-2xl',
  lg: 'px-6 py-4 rounded-2xl',
};

const textSizes: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  disabled,
  className = '',
  ...rest
}: ButtonProps & { className?: string }) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      className={`flex-row items-center justify-center gap-2 ${containerVariants[variant]} ${containerSizes[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      // `sm` is visually 40pt tall — the slop tops it up to the 44pt minimum.
      hitSlop={size === 'sm' ? { top: 4, bottom: 4 } : undefined}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.brandFg : colors.content} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <AppText className={`font-bold ${textSizes[size]} ${textVariants[variant]}`}>
            {label}
          </AppText>
        </>
      )}
    </PressableScale>
  );
}
