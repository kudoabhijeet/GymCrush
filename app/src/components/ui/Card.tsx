import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { PressableScale } from './PressableScale';

interface CardProps extends ViewProps {
  children: ReactNode;
  /** Makes the card tappable with a press-scale animation. */
  onPress?: () => void;
  className?: string;
}

/**
 * Base styles are applied conditionally so a caller's `className` can override
 * them cleanly. NativeWind doesn't resolve conflicting utilities the way web
 * Tailwind does — two `bg-*` (or `border`/`p-*`) on one element leave the
 * outcome to ordering, and a themed default (bg-surface-elevated) can win over
 * an override (bg-brand). So we drop each default when the caller supplies its
 * own, keeping exactly one of each on the element.
 */
const hasBg = (c: string) => /(^|\s)bg-/.test(c);
const hasBorder = (c: string) => /(^|\s)border(-|\s|$)/.test(c);
const hasPadding = (c: string) => /(^|\s)p[xytrbl]?-/.test(c);
const hasRadius = (c: string) => /(^|\s)rounded/.test(c);

function baseClasses(className: string): string {
  return [
    hasRadius(className) ? '' : 'rounded-2xl',
    hasBorder(className) ? '' : 'border border-surface-muted',
    hasBg(className) ? '' : 'bg-surface-elevated',
    hasPadding(className) ? '' : 'p-4',
  ]
    .filter(Boolean)
    .join(' ');
}

export function Card({ children, onPress, className = '', ...rest }: CardProps) {
  const cls = `${baseClasses(className)} ${className}`.replace(/\s+/g, ' ').trim();

  if (onPress) {
    return (
      <PressableScale onPress={onPress} className={cls}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View className={cls} {...rest}>
      {children}
    </View>
  );
}
