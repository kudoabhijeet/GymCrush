import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './Text';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  /** Right-aligned header slot (IconButtons, avatars…). */
  headerRight?: ReactNode;
  /** Set false for screens that manage their own lists (FlatList). */
  scroll?: boolean;
  children?: ReactNode;
}

/** Standard tab-screen chrome: safe area, big title header, scrollable body. */
export function ScreenScaffold({
  title,
  subtitle,
  headerRight,
  scroll = true,
  children,
}: ScreenScaffoldProps) {
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
        contentContainerClassName="px-5 pb-28 pt-4 gap-5"
        showsVerticalScrollIndicator={false}
      >
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
