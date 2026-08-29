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
// Width and color are dropped independently: a caller passing only
// `border-warning/30` still needs the default `border` to supply the width.
const hasBorderWidth = (c: string) => /(^|\s)border(-[xytrbl])?(-\d+)?(?=\s|$)/.test(c);
const hasBorderColor = (c: string) => /(^|\s)border-(?!dashed\b|dotted\b|solid\b)[a-z]{2,}/.test(c);
const hasPadding = (c: string) => /(^|\s)p[xytrbl]?-/.test(c);
const hasRadius = (c: string) => /(^|\s)rounded/.test(c);

function baseClasses(className: string): string {
  return [
    hasRadius(className) ? '' : 'rounded-2xl',
    hasBorderWidth(className) ? '' : 'border',
    hasBorderColor(className) ? '' : 'border-surface-muted',
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
      <PressableScale onPress={onPress} accessibilityRole="button" className={cls} {...rest}>
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
