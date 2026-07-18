import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { PressableScale } from './PressableScale';

interface CardProps extends ViewProps {
  children: ReactNode;
  /** Makes the card tappable with a press-scale animation. */
  onPress?: () => void;
  className?: string;
}

const base = 'rounded-2xl border border-surface-muted bg-surface-elevated p-4';

export function Card({ children, onPress, className = '', ...rest }: CardProps) {
  if (onPress) {
    return (
      <PressableScale onPress={onPress} className={`${base} ${className}`}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View className={`${base} ${className}`} {...rest}>
      {children}
    </View>
  );
}
