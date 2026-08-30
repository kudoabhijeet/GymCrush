import { useMemo, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, TrendingUp, Weight } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { formatRelativeDay, formatWeight, weightUnitLabel } from '@/lib/format';
import { useProfileStore } from '@/features/profile/profileStore';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useExerciseHistory } from '@/features/workout/hooks';

type Metric = 'e1rm' | 'weight' | 'volume';

export default function ExerciseHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const units = useProfileStore((s) => s.units);
  const unit = weightUnitLabel(units);
  const info = id ? exerciseLookup(id) : undefined;
  const { data: history, isPending, isError, refetch } = useExerciseHistory(id);
  const [chartWidth, setChartWidth] = useState(0);
  const [metric, setMetric] = useState<Metric>('e1rm');

  const best = history?.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), history[0]);
  const chronological = useMemo(() => [...(history ?? [])].reverse(), [history]);
  const series = useMemo(() => {
    switch (metric) {
      case 'weight':
        return chronological.map((p) => p.maxWeight);
      case 'volume':
        return chronological.map((p) => p.totalVolume);
      default:
        return chronological.map((p) => p.e1rm);
    }
  }, [chronological, metric]);

  const metricLabel =
    metric === 'e1rm' ? 'Estimated 1RM' : metric === 'weight' ? 'Best weight' : 'Session volume';

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title={info?.name ?? 'Exercise'} />

      {isError ? (
        <View className="px-5 pt-2">
          <ErrorState title="Couldn't load this exercise" onRetry={() => void refetch()} />
        </View>
      ) : isPending ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </View>
      ) : !history || history.length === 0 ? (
        <View className="px-5 pt-2">
          <EmptyState
            icon={<Weight size={26} color={colors.contentFaint} />}
            title="No history yet"
            message="Log this exercise in a workout to start tracking progression."
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-5 pb-16 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row gap-2">
            {info ? <Badge label={info.muscleGroup.replace('_', ' ')} tone="brand" /> : null}
            {info ? <Badge label={info.equipment.replace('_', ' ')} /> : null}
          </View>

          <View className="flex-row gap-3">
            <StatTile
              label="Best set"
              value={
                best
                  ? `${formatWeight(best.bestWeight, units)} × ${best.bestReps}`
                  : '—'
              }
              icon={<Award size={13} color={colors.contentFaint} />}
            />
            <StatTile
              label="Est. 1RM"
              value={best ? formatWeight(best.e1rm, units) : '—'}
              unit={unit}
              icon={<TrendingUp size={13} color={colors.contentFaint} />}
            />
          </View>

          {series.length >= 2 ? (
            <Card
              className="gap-3"
              onLayout={(e: LayoutChangeEvent) =>
                setChartWidth(e.nativeEvent.layout.width - 32)
              }
            >
              <SegmentedControl
                options={[
                  { value: 'e1rm', label: 'e1RM' },
                  { value: 'weight', label: 'Weight' },
                  { value: 'volume', label: 'Volume' },
                ]}
                value={metric}
                onChange={setMetric}
              />
              <AppText variant="label">{metricLabel}</AppText>
              {chartWidth > 0 ? (
                <Sparkline
                  data={series}
                  width={chartWidth}
                  height={90}
                  accessibilityLabel={`${metricLabel} trend`}
                />
              ) : null}
            </Card>
          ) : null}

          <View className="gap-2">
            <AppText variant="label">History</AppText>
            <View className="gap-3">
              {history.map((point) => (
                <Card key={point.sessionId} className="flex-row items-center justify-between">
                  <View className="gap-0.5">
                    <AppText variant="subheading">
                      {formatWeight(point.bestWeight, units)} {unit} × {point.bestReps}
                    </AppText>
                    <AppText variant="caption">{formatRelativeDay(point.date)}</AppText>
                  </View>
                  <View className="items-end gap-0.5">
                    <AppText className="font-extrabold text-[15px] text-content">
                      {formatWeight(point.e1rm, units)} {unit}
                    </AppText>
                    <AppText variant="caption">
                      e1RM · {Math.round(point.totalVolume)} kg vol
                    </AppText>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
