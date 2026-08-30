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
import { formatDuration, formatRelativeDay, localDateKey } from '@/lib/format';
import { usePlans } from '@/features/plans/hooks';
import { setVolume, useSessions } from '@/features/workout/hooks';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import { useStartSession } from '@/features/workout/useStartSession';
import { WeekStrip, weekStartMs } from '@/features/workout/components/WeekStrip';

const MS_DAY = 86_400_000;

export default function LogScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: sessions, isPending, isError, refetch } = useSessions();
  const { data: plans, refetch: refetchPlans } = usePlans();
  const activeSession = useActiveSessionStore((s) => s.session);
  const { startPlanDay, startFreestyle } = useStartSession();
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dayPicker, setDayPicker] = useState<WorkoutSession[] | null>(null);

  const weekSessions = useMemo(() => {
    const start = weekStartMs(Date.now(), weekOffset);
    const end = start + 7 * MS_DAY;
    return (sessions ?? []).filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return t >= start && t < end;
    });
  }, [sessions, weekOffset]);

  const listSessions = useMemo(() => {
    if (!selectedKey) return weekSessions;
    return weekSessions.filter((s) => localDateKey(new Date(s.startedAt)) === selectedKey);
  }, [weekSessions, selectedKey]);

  const onSelectDay = (key: string, onDay: WorkoutSession[]) => {
    haptics.selection();
    if (onDay.length === 1) {
      router.push({ pathname: '/workout/[id]', params: { id: onDay[0].id } });
      return;
    }
    if (onDay.length > 1) {
      setDayPicker(onDay);
      return;
    }
    // Empty day in the current week → offer to start a workout.
    setSelectedKey(key);
    if (weekOffset === 0 && !activeSession) setStartSheetOpen(true);
  };

  const onStartFreestyle = () => {
    setStartSheetOpen(false);
    startFreestyle();
  };

  const onStartPlanDay = (planId: string, dayId: string) => {
    const plan = plans?.find((p) => p.id === planId);
    const day = plan?.days.find((d) => d.id === dayId);
    if (!plan || !day) return;
    setStartSheetOpen(false);
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
          onPress={() => setStartSheetOpen(true)}
        />
      )}

      <WeekStrip
        sessions={sessions ?? []}
        weekOffset={weekOffset}
        onWeekOffsetChange={(o) => {
          setWeekOffset(o);
          setSelectedKey(null);
        }}
        selectedKey={selectedKey}
        onSelectDay={onSelectDay}
      />

      {isError ? (
        <ErrorState title="Couldn't load your history" onRetry={() => void refetch()} />
      ) : isPending ? (
        <SkeletonList rows={3} />
      ) : listSessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={26} color={colors.contentFaint} />}
          title={selectedKey ? 'No workout this day' : 'No workouts this week'}
          message={
            selectedKey
              ? 'Pick another day or start a session.'
              : 'Your logged sessions will show up here.'
          }
          actionLabel={activeSession ? undefined : 'Start workout'}
          onAction={activeSession ? undefined : () => setStartSheetOpen(true)}
        />
      ) : (
        <View className="gap-3">
          {listSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </View>
      )}

      <BottomSheet
        visible={startSheetOpen}
        onClose={() => setStartSheetOpen(false)}
        title="Start workout"
      >
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

          {(plans ?? []).map((plan) => (
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

      <BottomSheet
        visible={dayPicker !== null}
        onClose={() => setDayPicker(null)}
        title="Workouts that day"
      >
        <View className="gap-2">
          {(dayPicker ?? []).map((session) => (
            <ListRow
              key={session.id}
              title={session.name}
              subtitle={formatRelativeDay(session.startedAt)}
              onPress={() => {
                setDayPicker(null);
                router.push({ pathname: '/workout/[id]', params: { id: session.id } });
              }}
            />
          ))}
        </View>
      </BottomSheet>
    </ScreenScaffold>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const router = useRouter();
  const working = session.exercises.flatMap((e) =>
    e.sets.filter((s) => s.completed && !s.isWarmup),
  );
  const totalVolume = working.reduce((sum, s) => sum + setVolume(s.weight, s.reps), 0);

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
          <AppText className="font-bold text-[13px] text-content">{working.length}</AppText> sets
        </AppText>
        <AppText variant="caption">
          <AppText className="font-bold text-[13px] text-content">
            {Math.round((totalVolume / 1000) * 10) / 10}t
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
