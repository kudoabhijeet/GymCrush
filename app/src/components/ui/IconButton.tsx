import type { ReactNode } from 'react';
import { pressScale } from '@/lib/motion';
import { PressableScale } from './PressableScale';

interface IconButtonProps {
  icon: ReactNode;
  onPress?: () => void;
  /** Filled square vs borderless. */
  variant?: 'tonal' | 'plain';
  accessibilityLabel: string;
}

export function IconButton({ icon, onPress, variant = 'tonal', accessibilityLabel }: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={pressScale.icon}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      className={`h-10 w-10 items-center justify-center rounded-xl ${
        variant === 'tonal' ? 'bg-surface-muted' : ''
      }`}
    >
      {icon}
    </PressableScale>
  );
}
