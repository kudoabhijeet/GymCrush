import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Dumbbell, Weight } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { ListGroup, ListRow, ListSeparator } from '@/components/ui/ListRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { useThemeColors } from '@/lib/theme';
import { formatDuration, formatRelativeDay } from '@/lib/format';
import { useSession } from '@/features/workout/hooks';
import { exerciseLookup } from '@/features/exercises/hooks';

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { data: session, isLoading } = useSession(id);

  const totalSets = session?.exercises.reduce((sum, e) => sum + e.sets.length, 0) ?? 0;
  const totalVolume =
    session?.exercises.reduce(
      (sum, e) => sum + e.sets.reduce((v, s) => v + (s.weight ?? 0) * (s.reps ?? 0), 0),
      0,
    ) ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title={session?.name ?? 'Workout'} />

      {isLoading || !session ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-5 px-5 pb-16 pt-2" showsVerticalScrollIndicator={false}>
          <AppText variant="caption">{formatRelativeDay(session.startedAt)}</AppText>

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
            const best = exercise.sets.reduce(
              (a, b) => ((b.weight ?? 0) * (b.reps ?? 0) > (a.weight ?? 0) * (a.reps ?? 0) ? b : a),
              exercise.sets[0],
            );
            return (
              <Card key={exercise.id} className="gap-3">
                <View className="flex-row items-center justify-between">
                  <AppText variant="subheading" className="flex-1" numberOfLines={1}>
                    {info?.name ?? 'Exercise'}
                  </AppText>
                  <AppText variant="caption">
                    Best:{' '}
                    <AppText className="font-bold text-[13px] text-content">
                      {best?.weight ?? '—'} × {best?.reps ?? '—'}
                    </AppText>
                  </AppText>
                </View>
                <View className="gap-1.5">
                  {exercise.sets.map((set) => (
                    <View key={set.id} className="flex-row items-center gap-3">
                      <AppText variant="caption" className="w-8 font-bold">
                        {set.setNumber}
                      </AppText>
                      <AppText variant="body" className="flex-1">
                        {set.weight ?? '—'} kg × {set.reps ?? '—'}
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
