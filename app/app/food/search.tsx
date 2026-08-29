import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, X } from 'lucide-react-native';
import type { Food, Meal } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useThemeColors } from '@/lib/theme';
import { localDateKey } from '@/lib/format';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useAddFoodEntry, useFoods } from '@/features/nutrition/hooks';

const MEALS: { value: Meal; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

export default function FoodSearchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ date?: string; meal?: Meal }>();
  const date = params.date ?? localDateKey();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<Meal>(params.meal ?? 'breakfast');
  // The input stays instant; only the query key waits for a pause in typing.
  const { data: foods, isLoading } = useFoods(useDebouncedValue(search));
  const addEntry = useAddFoodEntry();

  const onAdd = () => {
    if (!selected) return;
    addEntry.mutate(
      { date, foodId: selected.id, servings, meal },
      {
        onSuccess: () => {
          setSelected(null);
          router.back();
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <AppText variant="heading">Log food</AppText>
        <View className="flex-row gap-2">
          <IconButton
            icon={<Plus size={20} color={colors.content} />}
            onPress={() => router.push('/food/new')}
            accessibilityLabel="Create custom food"
          />
          <IconButton
            icon={<X size={20} color={colors.content} />}
            onPress={() => router.back()}
            accessibilityLabel="Close"
          />
        </View>
      </View>

      <View className="px-5 pb-3">
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search foods…"
          leftIcon={<Search size={18} color={colors.contentFaint} />}
          autoFocus
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
          data={foods ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8"
          ItemSeparatorComponent={() => <View className="h-px bg-surface-muted" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.servingLabel} · P${item.proteinG} C${item.carbsG} F${item.fatG}`}
              right={
                <AppText className="font-bold text-[15px] text-content">{item.calories}</AppText>
              }
              onPress={() => {
                setSelected(item);
                setServings(1);
              }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center gap-3 py-16">
              <AppText variant="caption">No foods match your search.</AppText>
              <Button
                label="Create custom food"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/food/new')}
              />
            </View>
          }
        />
      )}

      {/* Add-serving sheet */}
      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected ? (
          <View className="gap-5">
            <View className="flex-row items-center justify-between">
              <AppText variant="caption">Servings ({selected.servingLabel})</AppText>
              <NumberStepper value={servings} onChange={setServings} step={0.5} min={0.5} max={20} />
            </View>

            <View className="flex-row justify-between rounded-2xl bg-surface-muted p-4">
              <MacroPreview label="kcal" value={Math.round(selected.calories * servings)} />
              <MacroPreview label="Protein" value={Math.round(selected.proteinG * servings)} suffix="g" />
              <MacroPreview label="Carbs" value={Math.round(selected.carbsG * servings)} suffix="g" />
              <MacroPreview label="Fat" value={Math.round(selected.fatG * servings)} suffix="g" />
            </View>

            <View className="gap-2">
              <AppText variant="caption">Meal</AppText>
              <View className="flex-row flex-wrap gap-2">
                {MEALS.map((m) => (
                  <Chip
                    key={m.value}
                    label={m.label}
                    selected={meal === m.value}
                    onPress={() => setMeal(m.value)}
                  />
                ))}
              </View>
            </View>

            <Button label="Add to log" size="lg" loading={addEntry.isPending} onPress={onAdd} />
          </View>
        ) : (
          <View />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function MacroPreview({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <View className="items-center gap-0.5">
      <AppText className="font-extrabold text-lg text-content">
        {value}
        {suffix}
      </AppText>
      <AppText variant="label">{label}</AppText>
    </View>
  );
}
