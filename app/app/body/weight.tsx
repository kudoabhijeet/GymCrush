import { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react-native';
import type { WeightEntry } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconButton } from '@/components/ui/IconButton';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { StatTile } from '@/components/ui/StatTile';
import { haptics } from '@/lib/haptics';
import { useThemeColors } from '@/lib/theme';
import { formatRelativeDay, formatWeight, fromKg, toKg, weightUnitLabel } from '@/lib/format';
import { useProfileStore } from '@/features/profile/profileStore';
import {
  useDeleteWeight,
  useLogWeight,
  useUpdateWeight,
  useWeightHistory,
} from '@/features/nutrition/hooks';

type SheetMode =
  | { kind: 'create' }
  | { kind: 'edit'; entry: WeightEntry }
  | { kind: 'confirmDelete'; entry: WeightEntry };

export default function WeightScreen() {
  const colors = useThemeColors();
  const units = useProfileStore((s) => s.units);
  const unit = weightUnitLabel(units);
  const { data: entries, isPending, isError, refetch } = useWeightHistory();
  const logWeight = useLogWeight();
  const updateWeight = useUpdateWeight();
  const deleteWeight = useDeleteWeight();
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [draft, setDraft] = useState(80);

  const latest = entries?.[entries.length - 1];
  const first = entries?.[0];
  const change = latest && first ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;

  const openCreate = () => {
    setDraft(fromKg(latest?.weightKg ?? 80, units));
    setSheet({ kind: 'create' });
  };

  const openEdit = (entry: WeightEntry) => {
    haptics.tap();
    setDraft(fromKg(entry.weightKg, units));
    setSheet({ kind: 'edit', entry });
  };

  const closeSheet = () => setSheet(null);

  const onSave = () => {
    const weightKg = toKg(draft, units);
    if (sheet?.kind === 'edit') {
      updateWeight.mutate(
        { id: sheet.entry.id, weightKg },
        { onSuccess: closeSheet },
      );
      return;
    }
    logWeight.mutate(weightKg, { onSuccess: closeSheet });
  };

  const onDelete = () => {
    if (sheet?.kind !== 'confirmDelete') return;
    deleteWeight.mutate(sheet.entry.id, { onSuccess: closeSheet });
  };

  const sheetTitle =
    sheet?.kind === 'confirmDelete'
      ? 'Delete entry?'
      : sheet?.kind === 'edit'
        ? 'Edit weight'
        : 'Log weight';

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader
        title="Bodyweight"
        actions={
          <IconButton
            icon={<Plus size={20} color={colors.content} />}
            onPress={openCreate}
            accessibilityLabel="Log weight"
          />
        }
      />

      {isError ? (
        <View className="px-5 pt-2">
          <ErrorState title="Couldn't load your weight log" onRetry={() => void refetch()} />
        </View>
      ) : isPending ? (
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
            onAction={openCreate}
          />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-5 pb-16 pt-2" showsVerticalScrollIndicator={false}>
          <View className="flex-row gap-3">
            <StatTile
              label="Current"
              value={formatWeight(latest?.weightKg, units)}
              unit={unit}
              icon={<Scale size={13} color={colors.contentFaint} />}
            />
            <StatTile
              label="Change"
              value={`${change > 0 ? '+' : change < 0 ? '−' : ''}${formatWeight(Math.abs(change), units)}`}
              unit={unit}
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
                <PressableScale
                  key={entry.id}
                  onPress={() => openEdit(entry)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${formatWeight(entry.weightKg, units)} ${unit}`}
                  className="flex-row items-center justify-between rounded-xl px-2 py-2.5"
                >
                  <AppText variant="subheading">
                    {formatWeight(entry.weightKg, units)} {unit}
                  </AppText>
                  <AppText variant="caption">{formatRelativeDay(entry.loggedAt)}</AppText>
                </PressableScale>
              ))}
            </Card>
          </View>
        </ScrollView>
      )}

      <BottomSheet visible={sheet !== null} onClose={closeSheet} title={sheetTitle}>
        {sheet?.kind === 'confirmDelete' ? (
          <View className="gap-3">
            <AppText variant="body">
              Remove {formatWeight(sheet.entry.weightKg, units)} {unit} from{' '}
              {formatRelativeDay(sheet.entry.loggedAt)}? This cannot be undone.
            </AppText>
            <Button
              label="Delete entry"
              variant="danger"
              loading={deleteWeight.isPending}
              onPress={onDelete}
            />
            <Button
              label="Keep entry"
              variant="secondary"
              onPress={() => setSheet({ kind: 'edit', entry: sheet.entry })}
            />
          </View>
        ) : (
          <View className="items-center gap-6">
            <NumberStepper
              value={draft}
              onChange={setDraft}
              step={0.1}
              min={units === 'lb' ? 66 : 30}
              max={units === 'lb' ? 660 : 300}
              format={(v) => `${Math.round(v * 10) / 10} ${unit}`}
            />
            <Button
              label="Save"
              size="lg"
              className="self-stretch"
              loading={logWeight.isPending || updateWeight.isPending}
              onPress={onSave}
            />
            {sheet?.kind === 'edit' ? (
              <Button
                label="Delete entry"
                variant="danger"
                className="self-stretch"
                onPress={() => setSheet({ kind: 'confirmDelete', entry: sheet.entry })}
              />
            ) : null}
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
