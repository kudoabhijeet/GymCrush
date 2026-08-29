import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Clock, Dumbbell, Weight } from 'lucide-react-native';
import type { LoggedSet } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListGroup, ListRow, ListSeparator } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { formatDuration, formatRelativeDay, weightUnitLabel } from '@/lib/format';
import { e1rmOf, useSession, useSessions } from '@/features/workout/hooks';
import { exerciseLookup } from '@/features/exercises/hooks';
import { useProfileStore } from '@/features/profile/profileStore';

const workingSetsOf = (sets: LoggedSet[]) => sets.filter((s) => s.completed && !s.isWarmup);

const bestByE1rm = (sets: LoggedSet[]) =>
  sets.reduce<LoggedSet | null>(
    (best, s) =>
      best === null || e1rmOf(s.weight, s.reps) > e1rmOf(best.weight, best.reps) ? s : best,
    null,
  );

interface ExerciseAnalysis {
  best: LoggedSet | null;
  isPr: boolean;
  /** Best set from the most recent earlier session with this exercise. */
  previous: LoggedSet | null;
}

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const units = useProfileStore((s) => s.units);
  const { data: session, isPending, isError, refetch } = useSession(id);
  const { data: sessions } = useSessions();

  // Compared against every other session, so a PR here means the same thing it
  // did live in the logger: it beat the best e1RM this exercise has ever seen.
  const analysis = useMemo(() => {
    const byExercise: Record<string, ExerciseAnalysis> = {};
    if (!session) return byExercise;

    // Only sessions that came *before* this one: opening an old workout from
    // history must not compare it against training that hadn't happened yet.
    const startedAt = new Date(session.startedAt).getTime();
    const others = (sessions ?? [])
      .filter((s) => s.id !== session.id && new Date(s.startedAt).getTime() < startedAt)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    for (const exercise of session.exercises) {
      const best = bestByE1rm(workingSetsOf(exercise.sets));

      let priorBest: number | null = null;
      let previous: LoggedSet | null = null;
      for (const other of others) {
        for (const logged of other.exercises) {
          if (logged.exerciseId !== exercise.exerciseId) continue;
          const working = workingSetsOf(logged.sets);
          if (working.length === 0) continue;
          for (const s of working) {
            const value = e1rmOf(s.weight, s.reps);
            if (priorBest === null || value > priorBest) priorBest = value;
          }
          // `others` is newest-first, so the first hit is the previous session.
          if (previous === null) previous = bestByE1rm(working);
        }
      }

      byExercise[exercise.id] = {
        best,
        previous,
        // No history at all isn't a PR — there was nothing to beat.
        isPr: best !== null && priorBest !== null && e1rmOf(best.weight, best.reps) > priorBest,
      };
    }
    return byExercise;
  }, [session, sessions]);

  const prCount = Object.values(analysis).filter((a) => a.isPr).length;

  // Warmups are excluded here for the same reason they are from Best/PR — they
  // aren't working volume.
  const totalSets =
    session?.exercises.reduce((sum, e) => sum + workingSetsOf(e.sets).length, 0) ?? 0;
  const totalVolume =
    session?.exercises.reduce(
      (sum, e) =>
        sum + workingSetsOf(e.sets).reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0),
      0,
    ) ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title={session?.name ?? 'Workout'} />

      {isError ? (
        <View className="px-5 pt-2">
          <ErrorState title="Couldn't load this workout" onRetry={() => void refetch()} />
        </View>
      ) : isPending || !session ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-5 pb-16 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="caption">{formatRelativeDay(session.startedAt)}</AppText>

          {prCount > 0 ? (
            <View className="flex-row items-center gap-2 rounded-xl bg-brand/10 p-3">
              <Award size={16} color={colors.brandText} />
              <AppText className="font-bold text-[15px] text-brand-text">
                {prCount === 1 ? 'New personal record' : `${prCount} new personal records`}
              </AppText>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <StatTile
              label="Duration"
              value={formatDuration(session.startedAt, session.finishedAt)}
              icon={<Clock size={13} color={colors.contentFaint} />}
            />
            <StatTile
              label="Sets"
              value={`${totalSets}`}
              icon={<Dumbbell size={13} color={colors.contentFaint} />}
            />
            <StatTile
              label="Volume"
              value={`${Math.round((totalVolume / 1000) * 10) / 10}`}
              unit="t"
              icon={<Weight size={13} color={colors.contentFaint} />}
            />
          </View>

          {session.exercises.map((exercise) => {
            const info = exerciseLookup(exercise.exerciseId);
            const { best, previous, isPr } = analysis[exercise.id] ?? {
              best: null,
              previous: null,
              isPr: false,
            };
            return (
              <Card key={exercise.id} className="gap-3">
                <View className="gap-1.5">
                  <View className="flex-row items-center gap-2">
                    <AppText variant="subheading" className="flex-1" numberOfLines={1}>
                      {info?.name ?? 'Exercise'}
                    </AppText>
                    {isPr ? (
                      <View className="flex-row items-center gap-1">
                        <Award size={12} color={colors.brandText} />
                        <Badge label="PR" tone="brand" />
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-row items-baseline justify-between">
                    <AppText variant="caption">
                      Best:{' '}
                      <AppText className="font-bold text-[13px] text-content">
                        {best ? `${best.weight ?? '—'} × ${best.reps ?? '—'}` : '—'}
                      </AppText>
                    </AppText>
                    <AppText variant="caption">
                      {previous
                        ? `Last time ${previous.weight ?? '—'} × ${previous.reps ?? '—'}`
                        : 'First time'}
                    </AppText>
                  </View>
                </View>
                <View className="gap-1.5">
                  {exercise.sets.map((set) => (
                    <View key={set.id} className="flex-row items-center gap-3">
                      <AppText variant="caption" className="w-8 font-bold">
                        {set.setNumber}
                      </AppText>
                      <AppText variant="body" className="flex-1">
                        {set.weight ?? '—'} {weightUnitLabel(units)} × {set.reps ?? '—'}
                      </AppText>
                      {set.rpe ? <AppText variant="caption">RPE {set.rpe}</AppText> : null}
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}

          <ListGroup>
            {session.exercises.map((exercise, i) => (
              <View key={exercise.id}>
                {i > 0 ? <ListSeparator /> : null}
                <ListRow
                  title={exerciseLookup(exercise.exerciseId)?.name ?? 'Exercise'}
                  subtitle="View progression"
                  onPress={() =>
                    router.push({ pathname: '/exercise/[id]', params: { id: exercise.exerciseId } })
                  }
                />
              </View>
            ))}
          </ListGroup>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
