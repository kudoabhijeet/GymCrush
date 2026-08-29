import { useCallback, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/lib/theme';
import { AppText } from './Text';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  /** Right-aligned header slot (IconButtons, avatars…). */
  headerRight?: ReactNode;
  /** Set false for screens that manage their own lists (FlatList). */
  scroll?: boolean;
  /**
   * Enables pull-to-refresh on the scroll branch. The scaffold owns the
   * spinner: it stays visible until the returned promise settles — pass
   * `() => Promise.all([refetchA(), refetchB()])`.
   */
  onRefresh?: () => Promise<unknown>;
  children?: ReactNode;
}

/** Standard tab-screen chrome: safe area, big title header, scrollable body. */
export function ScreenScaffold({
  title,
  subtitle,
  headerRight,
  scroll = true,
  onRefresh,
  children,
}: ScreenScaffoldProps) {
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const header = (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1 gap-1">
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {headerRight}
    </View>
  );

  if (!scroll) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <View className="flex-1 gap-5 px-5 pt-4">
          {header}
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView
        // The tab bar is opaque and non-absolute (see `(tabs)/_layout.tsx`), so
        // scenes are laid out above it and content never runs underneath —
        // `pb-28` is trailing scroll slack, and clearance for the Plans FAB.
        contentContainerClassName="px-5 pb-28 pt-4 gap-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.contentMuted}
              colors={[colors.brandText]}
            />
          ) : undefined
        }
      >
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
