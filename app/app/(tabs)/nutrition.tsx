import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Scale, Trash2, UtensilsCrossed } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DailyLogEntry, Meal } from '@gymcrush/shared';
import { useThemeColors } from '@/lib/theme';
import { formatRelativeDay, localDateKey } from '@/lib/format';
import { useProfileStore } from '@/features/profile/profileStore';
import { useDailyLog, useRemoveFoodEntry, useWeightHistory } from '@/features/nutrition/hooks';

const MEALS: { value: Meal; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

export default function NutritionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const macroTarget = useProfileStore((s) => s.macroTarget);
  const [dayOffset, setDayOffset] = useState(0);

  // Reads the clock during render on purpose. Freezing "now" at mount is the
  // obvious way to satisfy the purity rule, but it strands the screen on the
  // day it opened: a tab mounted at 23:50 would still log food into yesterday
  // at 00:10. Recomputing lets a re-render (including leaving and returning to
  // "Today") self-correct across midnight.
  // eslint-disable-next-line react-hooks/purity
  const date = useMemo(() => new Date(Date.now() + dayOffset * 86_400_000), [dayOffset]);
  const dateKey = localDateKey(date);

  const { data: log, isLoading } = useDailyLog(dateKey);
  const { data: weights } = useWeightHistory();
  const removeEntry = useRemoveFoodEntry();

  const totals = log?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const latestWeight = weights?.[weights.length - 1];

  const entriesByMeal = useMemo(() => {
    const map = new Map<Meal, DailyLogEntry[]>();
    for (const meal of MEALS) map.set(meal.value, []);
    for (const entry of log?.entries ?? []) {
      map.get(entry.meal)?.push(entry);
    }
    return map;
  }, [log]);

  const dayLabel =
    dayOffset === 0
      ? 'Today'
      : dayOffset === -1
        ? 'Yesterday'
        : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <ScreenScaffold
      title="Nutrition"
      headerRight={
        <View className="flex-row items-center gap-1">
          <IconButton
            icon={<ChevronLeft size={18} color={colors.content} />}
            onPress={() => setDayOffset((o) => o - 1)}
            accessibilityLabel="Previous day"
            variant="plain"
          />
          <AppText variant="subheading" className="min-w-[72px] text-center">
            {dayLabel}
          </AppText>
          <IconButton
            icon={<ChevronRight size={18} color={dayOffset >= 0 ? colors.contentFaint : colors.content} />}
            onPress={() => setDayOffset((o) => Math.min(0, o + 1))}
            accessibilityLabel="Next day"
            variant="plain"
          />
        </View>
      }
    >
      {/* Hero: calorie ring + macro bars */}
      <Card className="items-center gap-5 p-5">
        <ProgressRing
          progress={macroTarget ? totals.calories / macroTarget.calories : 0}
          size={170}
          strokeWidth={13}
        >
          <View className="items-center">
            <AppText variant="display">{totals.calories}</AppText>
            <AppText variant="label">of {macroTarget?.calories ?? '—'} kcal</AppText>
          </View>
        </ProgressRing>

        <View className="w-full gap-3">
          <MacroBar label="Protein" value={totals.proteinG} target={macroTarget?.proteinG} fill="bg-brand" />
          <MacroBar label="Carbs" value={totals.carbsG} target={macroTarget?.carbsG} fill="bg-accent" />
          <MacroBar label="Fat" value={totals.fatG} target={macroTarget?.fatG} fill="bg-warning" />
        </View>
      </Card>

      {/* Weight quick row */}
      <PressableScale
        onPress={() => router.push('/body/weight')}
        className="flex-row items-center gap-3 rounded-2xl border border-surface-muted bg-surface-elevated p-4"
      >
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-muted">
          <Scale size={18} color={colors.contentMuted} />
        </View>
        <View className="flex-1">
          <AppText variant="subheading">Bodyweight</AppText>
          <AppText variant="caption">
            {latestWeight
              ? `${latestWeight.weightKg} kg · ${formatRelativeDay(latestWeight.loggedAt)}`
              : 'No entries yet'}
          </AppText>
        </View>
        <ChevronRight size={18} color={colors.contentFaint} />
      </PressableScale>

      {/* Meals */}
      {isLoading ? (
        <View className="gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </View>
      ) : (
        MEALS.map((meal) => {
          const entries = entriesByMeal.get(meal.value) ?? [];
          const mealCalories = entries.reduce((sum, e) => sum + e.macros.calories, 0);
          return (
            <View key={meal.value} className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-baseline gap-2">
                  <AppText variant="heading">{meal.label}</AppText>
                  {mealCalories > 0 ? (
                    <AppText variant="caption">{mealCalories} kcal</AppText>
                  ) : null}
                </View>
                <IconButton
                  icon={<Plus size={18} color={colors.content} />}
                  onPress={() =>
                    router.push({
                      pathname: '/food/search',
                      params: { date: dateKey, meal: meal.value },
                    })
                  }
                  accessibilityLabel={`Add food to ${meal.label}`}
                />
              </View>

              {entries.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-surface-muted p-4">
                  <AppText variant="caption" className="text-center">
                    Nothing logged
                  </AppText>
                </View>
              ) : (
                <Card className="gap-1 p-2">
                  {entries.map((entry) => (
                      <View key={entry.id} className="flex-row items-center gap-3 rounded-xl px-2 py-2">
                        <View className="flex-1 gap-0.5">
                          <AppText variant="subheading">{entry.food.name}</AppText>
                          <AppText variant="caption">
                            {entry.servings} × {entry.food.servingLabel} · P{entry.macros.proteinG} C
                            {entry.macros.carbsG} F{entry.macros.fatG}
                          </AppText>
                        </View>
                        <AppText className="font-bold text-[15px] text-content">
                          {entry.macros.calories}
                        </AppText>
                        <PressableScale
                          onPress={() => removeEntry.mutate({ date: dateKey, entryId: entry.id })}
                          hitSlop={8}
                          accessibilityLabel="Remove entry"
                        >
                          <Trash2 size={15} color={colors.contentFaint} />
                        </PressableScale>
                      </View>
                  ))}
                </Card>
              )}
            </View>
          );
        })
      )}

      {!isLoading && (log?.entries.length ?? 0) === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed size={26} color={colors.contentFaint} />}
          title="Nothing logged this day"
          message="Add foods to any meal to track against your targets."
          actionLabel="Log food"
          onAction={() =>
            router.push({ pathname: '/food/search', params: { date: dateKey, meal: 'breakfast' } })
          }
        />
      ) : null}
    </ScreenScaffold>
  );
}

function MacroBar({
  label,
  value,
  target,
  fill,
}: {
  label: string;
  value: number;
  target?: number;
  fill: string;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="caption" className="font-semibold">
          {label}
        </AppText>
        <AppText variant="caption">
          <AppText className="font-bold text-[13px] text-content">{value}g</AppText>
          {target ? ` / ${target}g` : ''}
        </AppText>
      </View>
      <ProgressBar progress={target ? value / target : 0} fillClassName={fill} height={6} />
    </View>
  );
}
