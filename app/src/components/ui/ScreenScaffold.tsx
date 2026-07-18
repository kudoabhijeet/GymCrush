import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Standard screen chrome: safe area, header, scroll body. */
export function ScreenScaffold({ title, subtitle, children }: ScreenScaffoldProps) {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-24 pt-4 gap-6">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-content">{title}</Text>
          {subtitle ? <Text className="text-base text-content-muted">{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Placeholder card describing what a not-yet-built screen will contain. */
export function ComingSoon({ items }: { items: string[] }) {
  return (
    <View className="gap-3 rounded-2xl border border-surface-muted bg-surface-elevated p-5">
      <Text className="text-sm font-semibold uppercase tracking-wide text-content-faint">
        Coming soon
      </Text>
      {items.map((item) => (
        <View key={item} className="flex-row items-center gap-3">
          <View className="h-1.5 w-1.5 rounded-full bg-brand" />
          <Text className="flex-1 text-base text-content">{item}</Text>
        </View>
      ))}
    </View>
  );
}
