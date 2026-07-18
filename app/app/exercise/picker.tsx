import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import type { MuscleGroup } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useThemeColors } from '@/lib/theme';
import { useExercises } from '@/features/exercises/hooks';
import { useExercisePickerStore } from '@/features/exercises/pickerStore';

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hams' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'core', label: 'Core' },
  { value: 'calves', label: 'Calves' },
];

export default function ExercisePickerScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const resolve = useExercisePickerStore((s) => s.resolve);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | undefined>();
  const { data: exercises, isLoading } = useExercises(search, muscleGroup);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <AppText variant="heading">Choose exercise</AppText>
        <IconButton
          icon={<X size={20} color={colors.content} />}
          onPress={() => router.back()}
          accessibilityLabel="Close"
        />
      </View>

      <View className="gap-3 px-5 pb-3">
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises…"
          leftIcon={<Search size={18} color={colors.contentFaint} />}
          autoFocus
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MUSCLE_GROUPS}
          keyExtractor={(item) => item.value}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              selected={muscleGroup === item.value}
              onPress={() =>
                setMuscleGroup((current) => (current === item.value ? undefined : item.value))
              }
            />
          )}
        />
      </View>

      {isLoading ? (
        <View className="gap-2 px-5">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </View>
      ) : (
        <FlatList
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8"
          ItemSeparatorComponent={() => <View className="h-px bg-surface-muted" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={item.equipment.replace('_', ' ')}
              right={<Badge label={item.muscleGroup.replace('_', ' ')} />}
              onPress={() => {
                resolve(item);
                router.back();
              }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <AppText variant="caption">No exercises match your search.</AppText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
