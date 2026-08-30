import { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ClipboardList, Dumbbell, Play, Trophy, UtensilsCrossed } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Skeleton } from '@/components/ui/Skeleton';
import { haptics } from '@/lib/haptics';
import { BRAND, BRAND_FG, useThemeColors } from '@/lib/theme';
import { formatLongDate, formatRelativeDay, localDateKey } from '@/lib/format';
import { useCalendarDay } from '@/lib/useCalendarDay';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { usePlans } from '@/features/plans/hooks';
import { e1rmOf, setVolume, useSessions } from '@/features/workout/hooks';
import { weekStartMs } from '@/features/workout/components/WeekStrip';
import { useDailyLog } from '@/features/nutrition/hooks';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import { useStartSession } from '@/features/workout/useStartSession';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const macroTarget = useProfileStore((s) => s.macroTarget);
  const { data: plans, isPending: plansPending, refetch: refetchPlans } = usePlans();
  const { data: sessions, isPending: sessionsPending, refetch: refetchSessions } = useSessions();
  const today = useCalendarDay();
  const {
    data: dailyLog,
    isPending: dailyLogPending,
    refetch: refetchDailyLog,
  } = useDailyLog(localDateKey(new Date(today)));
  const { startPlanDay } = useStartSession();
  const activeSession = useActiveSessionStore((s) => s.session);

  /** Next day of the user's own (non-template) plan, cycling past the last logged day. */
  const nextWorkout = useMemo(() => {
    const myPlan = plans?.[0];
    if (!myPlan || myPlan.days.length === 0) return null;
    const lastPlanned = sessions?.find((s) => s.planId === myPlan.id && s.planDayId);
    const lastIndex = lastPlanned
      ? myPlan.days.findIndex((d) => d.id === lastPlanned.planDayId)
      : -1;
    const day = myPlan.days[(lastIndex + 1) % myPlan.days.length];
    return { plan: myPlan, day };
  }, [plans, sessions]);

  /** Filled dots for the last 7 days with a logged session. */
  const weekDots = useMemo(() => {
    const days: { label: string; trained: boolean; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today - i * 86_400_000);
      const key = localDateKey(date);
      const trained = (sessions ?? []).some((s) => localDateKey(new Date(s.startedAt)) === key);
      days.push({
        label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
        trained,
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions, today]);

  /** Sessions whose best e1RM beat all prior sessions for that exercise. */
  const recentPRs = useMemo(() => {
    if (!sessions) return [];
    const chronological = [...sessions].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
    const best = new Map<string, number>();
    const prs: { exerciseId: string; weight: number; reps: number; date: string }[] = [];
    for (const session of chronological) {
      for (const logged of session.exercises) {
        for (const s of logged.sets) {
          if (!s.completed || s.isWarmup || s.weight == null || s.reps == null) continue;
          const e1rm = e1rmOf(s.weight, s.reps);
          if (e1rm > (best.get(logged.exerciseId) ?? 0)) {
            best.set(logged.exerciseId, e1rm);
            prs.push({
              exerciseId: logged.exerciseId,
              weight: s.weight,
              reps: s.reps,
              date: session.startedAt,
            });
          }
        }
      }
    }
    return prs.slice(-3).reverse();
  }, [sessions]);

  /** This week's working volume by muscle group (top 4). */
  const weekMuscleVolume = useMemo(() => {
    const start = weekStartMs(today, 0);
    const end = start + 7 * 86_400_000;
    const byMuscle = new Map<string, number>();
    for (const session of sessions ?? []) {
      const t = new Date(session.startedAt).getTime();
      if (t < start || t >= end) continue;
      for (const logged of session.exercises) {
        const muscle = exerciseLookup(logged.exerciseId)?.muscleGroup;
        if (!muscle) continue;
        let vol = 0;
        for (const s of logged.sets) {
          if (!s.completed || s.isWarmup) continue;
          vol += setVolume(s.weight, s.reps);
        }
        if (vol > 0) byMuscle.set(muscle, (byMuscle.get(muscle) ?? 0) + vol);
      }
    }
    return [...byMuscle.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([muscle, volume]) => ({ muscle, volume }));
  }, [sessions, today]);

  const startNextWorkout = () => {
    if (!nextWorkout) {
      router.push('/(tabs)/log');
      return;
    }
    startPlanDay(nextWorkout.plan, nextWorkout.day);
  };

  const calorieProgress = macroTarget ? (dailyLog?.totals.calories ?? 0) / macroTarget.calories : 0;
  // The hero reads plan + history; while those are in flight it must not
  // flash "Freestyle session" at a user who has a plan. A local active
  // session needs no network, so it always renders immediately.
  const heroPending = !activeSession && (plansPending || sessionsPending);
  const isColdStart =
    !plansPending && !sessionsPending && (plans?.length ?? 0) === 0 && (sessions?.length ?? 0) === 0;

  return (
    <ScreenScaffold
      title={user ? `Hey, ${user.displayName}` : 'Welcome'}
      subtitle={formatLongDate(new Date())}
      onRefresh={() => Promise.all([refetchPlans(), refetchSessions(), refetchDailyLog()])}
    >
      {/* Today hero — brand fill via inline style so it always wins the cascade */}
      {heroPending ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : (
      <Card className="gap-4 border-0 p-5" style={{ backgroundColor: BRAND }}>
        <View className="flex-row items-center justify-between">
          <AppText variant="label" style={{ color: BRAND_FG, opacity: 0.6 }}>
            {activeSession ? 'In progress' : "Today's workout"}
          </AppText>
          <Dumbbell size={18} color={BRAND_FG} />
        </View>
        <View className="gap-1">
          <AppText variant="title" style={{ color: BRAND_FG }}>
            {activeSession?.name ?? nextWorkout?.day.name ?? 'Freestyle session'}
          </AppText>
          <AppText variant="caption" style={{ color: BRAND_FG, opacity: 0.7 }}>
            {activeSession
              ? 'Pick up where you left off'
              : nextWorkout
                ? `${nextWorkout.plan.name} · ${nextWorkout.day.exercises.length} exercises`
                : 'No plan selected — start freestyle or pick a plan'}
          </AppText>
        </View>
        <PressableScale
          onPress={
            activeSession
              ? () => {
                  haptics.tap();
                  router.push('/workout/active');
                }
              : startNextWorkout
          }
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-2 rounded-xl py-3.5"
          style={{ backgroundColor: BRAND_FG }}
        >
          <Play size={16} color={BRAND} fill={BRAND} />
          <AppText className="font-bold text-[15px]" style={{ color: BRAND }}>
            {activeSession ? 'Resume workout' : 'Start workout'}
          </AppText>
        </PressableScale>
      </Card>
      )}

      {isColdStart ? (
        <EmptyState
          icon={<ClipboardList size={26} color={colors.contentFaint} />}
          title="Welcome to GymCrush"
          message="Create a plan to get day-by-day workouts, or start a freestyle session above."
          actionLabel="Create a plan"
          onAction={() => router.push('/plan/new')}
        />
      ) : null}

      {/* Week strip */}
      {sessionsPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
      <Card className="gap-3">
        <AppText variant="label">This week</AppText>
        <View className="flex-row justify-between">
          {weekDots.map((day, i) => (
            <View key={i} className="items-center gap-2">
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  day.trained ? 'bg-brand' : 'bg-surface-muted'
                } ${day.isToday ? 'border-2 border-brand-text' : ''}`}
              >
                {day.trained ? <Dumbbell size={14} color={BRAND_FG} /> : null}
              </View>
              <AppText variant="caption" className={day.isToday ? 'text-content font-bold' : ''}>
                {day.label}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
      )}

      {/* Macros summary */}
      {dailyLogPending ? (
        <Skeleton className="h-36 rounded-2xl" />
      ) : (
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <AppText variant="label">Today&apos;s nutrition</AppText>
          <PressableScale onPress={() => router.push('/(tabs)/nutrition')} hitSlop={8}>
            <ArrowRight size={16} color={colors.contentFaint} />
          </PressableScale>
        </View>
        <View className="flex-row items-baseline gap-1.5">
          <AppText className="font-extrabold text-[26px] leading-[32px] text-content">
            {dailyLog?.totals.calories ?? 0}
          </AppText>
          <AppText variant="caption">/ {macroTarget?.calories ?? '—'} kcal</AppText>
        </View>
        <ProgressBar progress={calorieProgress} height={6} />
        <View className="flex-row gap-4">
          <AppText variant="caption">
            P{' '}
            <AppText className="font-bold text-[13px] text-content">
              {dailyLog?.totals.proteinG ?? 0}g
            </AppText>
          </AppText>
          <AppText variant="caption">
            C{' '}
            <AppText className="font-bold text-[13px] text-content">
              {dailyLog?.totals.carbsG ?? 0}g
            </AppText>
          </AppText>
          <AppText variant="caption">
            F{' '}
            <AppText className="font-bold text-[13px] text-content">
              {dailyLog?.totals.fatG ?? 0}g
            </AppText>
          </AppText>
        </View>
      </Card>
      )}

      {/* This week's volume by muscle */}
      {weekMuscleVolume.length > 0 ? (
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText variant="label">This week&apos;s volume</AppText>
            <PressableScale onPress={() => router.push('/(tabs)/log')} hitSlop={8}>
              <ArrowRight size={16} color={colors.contentFaint} />
            </PressableScale>
          </View>
          {weekMuscleVolume.map(({ muscle, volume }) => {
            const max = weekMuscleVolume[0].volume || 1;
            return (
              <View key={muscle} className="gap-1.5">
                <View className="flex-row items-baseline justify-between">
                  <AppText variant="subheading" className="capitalize">
                    {muscle.replace('_', ' ')}
                  </AppText>
                  <AppText variant="caption">
                    {Math.round(volume / 1000 * 10) / 10}t
                  </AppText>
                </View>
                <ProgressBar progress={volume / max} height={6} />
              </View>
            );
          })}
        </Card>
      ) : null}

      {/* Recent PRs */}
      {recentPRs.length > 0 ? (
        <Card className="gap-1 p-2">
          <View className="flex-row items-center gap-2 px-2 pt-2">
            <Trophy size={14} color={colors.warning} />
            <AppText variant="label">Recent PRs</AppText>
          </View>
          {recentPRs.map((pr, i) => (
            <PressableScale
              key={i}
              onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: pr.exerciseId } })}
              className="flex-row items-center justify-between rounded-xl px-2 py-2.5"
            >
              <AppText variant="subheading">{exerciseLookup(pr.exerciseId)?.name ?? '—'}</AppText>
              <View className="items-end">
                <AppText className="font-extrabold text-[15px] text-content">
                  {pr.weight} kg × {pr.reps}
                </AppText>
                <AppText variant="caption">{formatRelativeDay(pr.date)}</AppText>
              </View>
            </PressableScale>
          ))}
        </Card>
      ) : null}

      {/* Quick actions */}
      <View className="flex-row gap-3">
        <PressableScale
          onPress={() => router.push('/food/search')}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-surface-muted bg-surface-elevated py-3.5"
        >
          <UtensilsCrossed size={16} color={colors.contentMuted} />
          <AppText className="font-semibold text-[13px] text-content-muted">Log food</AppText>
        </PressableScale>
        <PressableScale
          onPress={() => router.push('/body/weight')}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-surface-muted bg-surface-elevated py-3.5"
        >
          <ArrowRight size={16} color={colors.contentMuted} />
          <AppText className="font-semibold text-[13px] text-content-muted">Log weight</AppText>
        </PressableScale>
      </View>
    </ScreenScaffold>
  );
}
