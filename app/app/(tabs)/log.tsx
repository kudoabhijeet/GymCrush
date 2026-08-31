import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Dumbbell, Play, Zap } from 'lucide-react-native';
import type { WorkoutSession } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListRow } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { SkeletonList } from '@/components/ui/Skeleton';
import { haptics } from '@/lib/haptics';
import { BRAND_FG, useThemeColors } from '@/lib/theme';
import { formatDuration, formatRelativeDay } from '@/lib/format';
import { usePlans } from '@/features/plans/hooks';
import { useSessions } from '@/features/workout/hooks';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import { useStartSession } from '@/features/workout/useStartSession';

export default function LogScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: sessions, isPending, isError, refetch } = useSessions();
  const { data: plans, refetch: refetchPlans } = usePlans();
  const activeSession = useActiveSessionStore((s) => s.session);
  const { startPlanDay, startFreestyle } = useStartSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  /** Sessions grouped into This week / Last week / Earlier. */
  const groups = useMemo(() => {
    const result: { title: string; sessions: WorkoutSession[] }[] = [
      { title: 'This week', sessions: [] },
      { title: 'Last week', sessions: [] },
      { title: 'Earlier', sessions: [] },
    ];
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 86_400_000);

    for (const session of sessions ?? []) {
      const started = new Date(session.startedAt);
      if (started >= startOfWeek) result[0].sessions.push(session);
      else if (started >= startOfLastWeek) result[1].sessions.push(session);
      else result[2].sessions.push(session);
    }
    return result.filter((g) => g.sessions.length > 0);
  }, [sessions]);

  const onStartFreestyle = () => {
    setSheetOpen(false);
    startFreestyle();
  };

  const onStartPlanDay = (planId: string, dayId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    const day = plan?.days.find((d) => d.id === dayId);
    if (!plan || !day) return;
    setSheetOpen(false);
    startPlanDay(plan, day);
  };

  return (
    <ScreenScaffold
      title="Log"
      subtitle="Every session, every set."
      onRefresh={() => Promise.all([refetch(), refetchPlans()])}
    >
      {activeSession ? (
        <PressableScale
          onPress={() => {
            haptics.tap();
            router.push('/workout/active');
          }}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-2xl bg-brand p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-fg">
            <Zap size={18} color={colors.brand} fill={colors.brand} />
          </View>
          <View className="flex-1">
            <AppText className="font-bold text-[15px] text-brand-fg">
              {activeSession.name} in progress
            </AppText>
            <AppText variant="caption" className="text-brand-fg/70">
              Tap to resume
            </AppText>
          </View>
          <ChevronRight size={18} color={BRAND_FG} />
        </PressableScale>
      ) : (
        <Button
          label="Start workout"
          size="lg"
          icon={<Play size={16} color={BRAND_FG} fill={BRAND_FG} />}
          onPress={() => setSheetOpen(true)}
        />
      )}

      {isError ? (
        <ErrorState
          title="Couldn't load your history"
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <SkeletonList rows={3} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={26} color={colors.contentFaint} />}
          title="No workouts yet"
          message="Your logged sessions will show up here."
          actionLabel="Start workout"
          onAction={() => setSheetOpen(true)}
        />
      ) : (
        groups.map((group) => (
          <View key={group.title} className="gap-2">
            <AppText variant="label">{group.title}</AppText>
            <View className="gap-3">
              {group.sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </View>
          </View>
        ))
      )}

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Start workout">
        <View className="gap-4">
          <PressableScale
            onPress={onStartFreestyle}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-2xl bg-brand p-4"
          >
            <Zap size={20} color={BRAND_FG} />
            <View className="flex-1">
              <AppText className="font-bold text-[15px] text-brand-fg">Freestyle</AppText>
              <AppText variant="caption" className="text-brand-fg/70">
                Empty session — add exercises as you go
              </AppText>
            </View>
          </PressableScale>

          {(plans ?? [])
            .filter((p) => !p.isTemplate)
            .map((plan) => (
              <View key={plan.id} className="gap-2">
                <AppText variant="label">{plan.name}</AppText>
                <View className="gap-2">
                  {plan.days.map((day) => (
                    <ListRow
                      key={day.id}
                      title={day.name}
                      subtitle={`${day.exercises.length} exercises`}
                      left={
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
                          <Dumbbell size={16} color={colors.contentMuted} />
                        </View>
                      }
                      onPress={() => onStartPlanDay(plan.id, day.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
        </View>
      </BottomSheet>
    </ScreenScaffold>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const router = useRouter();
  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const totalVolume = session.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0),
    0,
  );

  return (
    <Card
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: session.id } })}
      className="gap-2"
    >
      <View className="flex-row items-center justify-between">
        <AppText variant="subheading">{session.name}</AppText>
        <AppText variant="caption">{formatRelativeDay(session.startedAt)}</AppText>
      </View>
      <View className="flex-row gap-4">
        <AppText variant="caption">
          <AppText className="font-bold text-[13px] text-content">{session.exercises.length}</AppText>{' '}
          exercises
        </AppText>
        <AppText variant="caption">
          <AppText className="font-bold text-[13px] text-content">{totalSets}</AppText> sets
        </AppText>
        <AppText variant="caption">
          <AppText className="font-bold text-[13px] text-content">
            {Math.round(totalVolume / 1000 * 10) / 10}t
          </AppText>{' '}
          volume
        </AppText>
        <AppText variant="caption">
          <AppText className="font-bold text-[13px] text-content">
            {formatDuration(session.startedAt, session.finishedAt)}
          </AppText>
        </AppText>
      </View>
    </Card>
  );
}
