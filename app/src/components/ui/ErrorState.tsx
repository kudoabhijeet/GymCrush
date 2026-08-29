import { View } from 'react-native';
import { CloudOff } from 'lucide-react-native';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Usually the query's `refetch`. */
  onRetry?: () => void;
}

/**
 * EmptyState's failure-shaped sibling. Use per screen as
 * `if (isError) return <ErrorState onRetry={refetch} />` — before the loading
 * branch, so a failed query can't impersonate an infinite skeleton.
 */
export function ErrorState({
  title = "Couldn't load this",
  message = 'Check your connection and try again.',
  onRetry,
}: ErrorStateProps) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-3 rounded-2xl border border-dashed border-surface-muted px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
        <CloudOff size={26} color={colors.contentFaint} />
      </View>
      <AppText variant="subheading" className="text-center">
        {title}
      </AppText>
      <AppText variant="caption" className="text-center">
        {message}
      </AppText>
      {onRetry ? <Button label="Try again" size="sm" onPress={onRetry} className="mt-2" /> : null}
    </View>
  );
}
