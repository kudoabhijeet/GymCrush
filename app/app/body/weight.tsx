import { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { formatRelativeDay } from '@/lib/format';
import { useLogWeight, useWeightHistory } from '@/features/nutrition/hooks';

export default function WeightScreen() {
  const colors = useThemeColors();
  const { data: entries, isLoading } = useWeightHistory();
  const logWeight = useLogWeight();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const latest = entries?.[entries.length - 1];
  const [draft, setDraft] = useState(80);
  const first = entries?.[0];
  const change = latest && first ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;

  const openSheet = () => {
    setDraft(latest?.weightKg ?? 80);
    setSheetOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader
        title="Bodyweight"
        actions={
          <IconButton
            icon={<Plus size={20} color={colors.content} />}
            onPress={openSheet}
            accessibilityLabel="Log weight"
          />
        }
      />

      {isLoading ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </View>
      ) : !entries || entries.length === 0 ? (
        <View className="px-5 pt-2">
          <EmptyState
            icon={<Scale size={26} color={colors.contentFaint} />}
            title="No weight entries"
            message="Log your bodyweight to see the trend over time."
            actionLabel="Log weight"
            onAction={openSheet}
          />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-5 pb-16 pt-2" showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-3">
            <StatTile
              label="Current"
              value={`${latest?.weightKg ?? '—'}`}
              unit="kg"
              icon={<Scale size={13} color={colors.contentFaint} />}
            />
            <StatTile
              label="Change"
              value={`${change > 0 ? '+' : ''}${change}`}
              unit="kg"
              icon={
                change <= 0 ? (
                  <TrendingDown size={13} color={colors.success} />
                ) : (
                  <TrendingUp size={13} color={colors.accent} />
                )
              }
            />
          </View>

          <Card
            className="gap-3"
            onLayout={(e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width - 32)}
          >
            <AppText variant="label">Trend</AppText>
            {chartWidth > 0 ? (
              <Sparkline data={entries.map((e) => e.weightKg)} width={chartWidth} height={100} />
            ) : null}
          </Card>

          <View className="gap-2">
            <AppText variant="label">Entries</AppText>
            <Card className="gap-1 p-2">
              {[...entries].reverse().map((entry) => (
                <View key={entry.id} className="flex-row items-center justify-between rounded-xl px-2 py-2.5">
                  <AppText variant="subheading">{entry.weightKg} kg</AppText>
                  <AppText variant="caption">{formatRelativeDay(entry.loggedAt)}</AppText>
                </View>
              ))}
            </Card>
          </View>
        </ScrollView>
      )}

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Log weight">
        <View className="items-center gap-6">
          <NumberStepper
            value={draft}
            onChange={setDraft}
            step={0.1}
            min={35}
            max={250}
            format={(v) => `${Math.round(v * 10) / 10} kg`}
          />
          <Button
            label="Save"
            size="lg"
            className="self-stretch"
            loading={logWeight.isPending}
            onPress={() =>
              logWeight.mutate(Math.round(draft * 10) / 10, {
                onSuccess: () => setSheetOpen(false),
              })
            }
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
