import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup, ListRow, ListSeparator } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { BRAND_FG, useThemeColors } from '@/lib/theme';
import { formatPrescription } from '@/lib/format';
import { useDeletePlan, useDuplicatePlan, usePlan } from '@/features/plans/hooks';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import type { PlanDay } from '@gymcrush/shared';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { data: plan, isLoading } = usePlan(id);
  const duplicatePlan = useDuplicatePlan();
  const deletePlan = useDeletePlan();
  const startSession = useActiveSessionStore((s) => s.start);
  const [menuOpen, setMenuOpen] = useState(false);

  const startDay = (day: PlanDay) => {
    if (!plan) return;
    startSession({
      name: day.name,
      planId: plan.id,
      planDayId: day.id,
      prescriptions: day.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        restSeconds: e.restSeconds,
      })),
    });
    router.push('/workout/active');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader
        title={plan?.name ?? 'Plan'}
        actions={
          <IconButton
            icon={<MoreHorizontal size={20} color={colors.content} />}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Plan options"
          />
        }
      />

      {isLoading || !plan ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-5 pb-16 pt-2" showsVerticalScrollIndicator={false}>
          <Card className="gap-3">
            {plan.description ? <AppText variant="body">{plan.description}</AppText> : null}
            <View className="flex-row gap-2">
              <Badge label={plan.goal.replace('_', ' ')} tone="brand" />
              <Badge label={`${plan.daysPerWeek}x / week`} />
              {plan.isTemplate ? <Badge label="Template" tone="accent" /> : null}
            </View>
            {plan.isTemplate ? (
              <Button
                label="Use this template"
                loading={duplicatePlan.isPending}
                onPress={() =>
                  duplicatePlan.mutate(plan.id, {
                    onSuccess: (copy) =>
                      router.replace({ pathname: '/plan/[id]', params: { id: copy.id } }),
                  })
                }
              />
            ) : null}
          </Card>

          {plan.days.map((day) => (
            <View key={day.id} className="gap-2">
              <View className="flex-row items-center justify-between">
                <AppText variant="heading">{day.name}</AppText>
                <PressableScale
                  onPress={() => startDay(day)}
                  className="flex-row items-center gap-1.5 rounded-full bg-brand px-4 py-2"
                >
                  <Play size={12} color={BRAND_FG} fill={BRAND_FG} />
                  <AppText className="font-bold text-[13px] text-brand-fg">Start</AppText>
                </PressableScale>
              </View>
              <ListGroup>
                {day.exercises.map((exercise, i) => {
                  const info = exerciseLookup(exercise.exerciseId);
                  return (
                    <View key={exercise.id}>
                      {i > 0 ? <ListSeparator /> : null}
                      <ListRow
                        title={info?.name ?? 'Unknown exercise'}
                        subtitle={formatPrescription(
                          exercise.targetSets,
                          exercise.targetReps,
                          exercise.targetRpe,
                        )}
                        right={
                          info ? (
                            <Badge label={info.muscleGroup.replace('_', ' ')} />
                          ) : undefined
                        }
                        onPress={() =>
                          router.push({
                            pathname: '/exercise/[id]',
                            params: { id: exercise.exerciseId },
                          })
                        }
                      />
                    </View>
                  );
                })}
              </ListGroup>
            </View>
          ))}
        </ScrollView>
      )}

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Plan options">
        <View className="gap-1">
          {/* Templates are owned by the system account — editing/deleting would 404. */}
          {plan?.isTemplate ? null : (
            <ListRow
              title="Edit plan"
              left={<Pencil size={20} color={colors.content} />}
              onPress={() => {
                setMenuOpen(false);
                router.push({ pathname: '/plan/[id]/edit', params: { id: id! } });
              }}
            />
          )}
          <ListRow
            title={plan?.isTemplate ? 'Use this template' : 'Duplicate'}
            left={<Copy size={20} color={colors.content} />}
            onPress={() => {
              setMenuOpen(false);
              duplicatePlan.mutate(id!, { onSuccess: () => router.back() });
            }}
          />
          {plan?.isTemplate ? null : (
            <ListRow
              title="Delete plan"
              destructive
              left={<Trash2 size={20} color={colors.danger} />}
              onPress={() => {
                setMenuOpen(false);
                deletePlan.mutate(id!, { onSuccess: () => router.back() });
              }}
            />
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
