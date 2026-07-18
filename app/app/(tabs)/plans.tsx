import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, ClipboardList, Layers, Plus } from 'lucide-react-native';
import type { Goal, WorkoutPlan } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { BRAND_FG, useThemeColors } from '@/lib/theme';
import { usePlans } from '@/features/plans/hooks';

const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  fat_loss: 'Fat loss',
  general_fitness: 'General',
  endurance: 'Endurance',
};

export default function PlansScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: plans, isLoading } = usePlans();
  const [tab, setTab] = useState<'mine' | 'explore'>('mine');

  const visible = useMemo(
    () => (plans ?? []).filter((p) => (tab === 'mine' ? !p.isTemplate : p.isTemplate)),
    [plans, tab],
  );

  return (
    <View className="flex-1">
      <ScreenScaffold title="Plans" subtitle="Programs built around your goals.">
        <SegmentedControl
          options={[
            { value: 'mine', label: 'My plans' },
            { value: 'explore', label: 'Explore' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {isLoading ? (
          <View className="gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={26} color={colors.contentFaint} />}
            title={tab === 'mine' ? 'No plans yet' : 'No templates'}
            message={
              tab === 'mine'
                ? 'Create your first plan or duplicate one from Explore.'
                : 'Check back soon for curated programs.'
            }
            actionLabel={tab === 'mine' ? 'Create a plan' : undefined}
            onAction={tab === 'mine' ? () => router.push('/plan/new') : undefined}
          />
        ) : (
          <View className="gap-3">
            {visible.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </View>
        )}
      </ScreenScaffold>

      {/* FAB */}
      <PressableScale
        onPress={() => router.push('/plan/new')}
        scaleTo={0.9}
        accessibilityLabel="Create plan"
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-lg"
      >
        <Plus size={24} color={BRAND_FG} strokeWidth={2.5} />
      </PressableScale>
    </View>
  );
}

function PlanCard({ plan }: { plan: WorkoutPlan }) {
  const router = useRouter();
  const colors = useThemeColors();
  const totalExercises = plan.days.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <Card
      onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
      className="gap-3"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <AppText variant="heading">{plan.name}</AppText>
          {plan.description ? (
            <AppText variant="caption" numberOfLines={2}>
              {plan.description}
            </AppText>
          ) : null}
        </View>
        <Badge label={GOAL_LABELS[plan.goal]} tone="brand" />
      </View>
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <CalendarDays size={14} color={colors.contentFaint} />
          <AppText variant="caption">{plan.daysPerWeek} days / week</AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Layers size={14} color={colors.contentFaint} />
          <AppText variant="caption">
            {plan.days.length} days · {totalExercises} exercises
          </AppText>
        </View>
      </View>
    </Card>
  );
}
