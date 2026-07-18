import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

const base = 'flex-row items-center justify-center rounded-2xl px-5 py-4';
const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand active:bg-brand-dark',
  secondary: 'bg-surface-muted active:opacity-80',
  ghost: 'bg-transparent active:bg-surface-muted',
};
const textVariants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-black',
  secondary: 'text-content',
  ghost: 'text-content-muted',
};

export function Button({ label, variant = 'primary', loading, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <Text className={`text-base font-bold ${textVariants[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
