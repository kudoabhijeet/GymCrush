import { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, TrendingUp, Weight } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { formatRelativeDay } from '@/lib/format';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useExerciseHistory } from '@/features/workout/hooks';

export default function ExerciseHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const info = id ? exerciseLookup(id) : undefined;
  const { data: history, isLoading } = useExerciseHistory(id);
  const [chartWidth, setChartWidth] = useState(0);

  const best = history?.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), history[0]);
  /** Chronological e1RM series for the chart. */
  const series = [...(history ?? [])].reverse().map((p) => p.e1rm);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title={info?.name ?? 'Exercise'} />

      {isLoading ? (
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
        <ScrollView contentContainerClassName="gap-5 px-5 pb-16 pt-2" showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {info ? <Badge label={info.muscleGroup.replace('_', ' ')} tone="brand" /> : null}
            {info ? <Badge label={info.equipment.replace('_', ' ')} /> : null}
          </View>

          <View className="flex-row gap-3">
            <StatTile
              label="Best set"
              value={best ? `${best.bestWeight} × ${best.bestReps}` : '—'}
              icon={<Award size={13} color={colors.contentFaint} />}
            />
            <StatTile
              label="Est. 1RM"
              value={best ? `${best.e1rm}` : '—'}
              unit="kg"
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
              <AppText variant="label">Estimated 1RM trend</AppText>
              {chartWidth > 0 ? <Sparkline data={series} width={chartWidth} height={90} /> : null}
            </Card>
          ) : null}

          <View className="gap-2">
            <AppText variant="label">History</AppText>
            <View className="gap-3">
              {history.map((point) => (
                <Card key={point.sessionId} className="flex-row items-center justify-between">
                  <View className="gap-0.5">
                    <AppText variant="subheading">
                      {point.bestWeight} kg × {point.bestReps}
                    </AppText>
                    <AppText variant="caption">{formatRelativeDay(point.date)}</AppText>
                  </View>
                  <View className="items-end gap-0.5">
                    <AppText className="font-extrabold text-[15px] text-content">
                      {point.e1rm} kg
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
