import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  /** Lucide icon element, sized ~28, colored by the caller. */
  icon: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 rounded-2xl border border-dashed border-surface-muted px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
        {icon}
      </View>
      <AppText variant="subheading" className="text-center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" className="text-center">
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} size="sm" onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}
