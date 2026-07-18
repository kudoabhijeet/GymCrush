import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createFoodSchema } from '@gymcrush/shared';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { useCreateFood } from '@/features/nutrition/hooks';

export default function NewFoodScreen() {
  const router = useRouter();
  const createFood = useCreateFood();
  const [name, setName] = useState('');
  const [servingLabel, setServingLabel] = useState('100g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    const parsed = createFoodSchema.safeParse({
      name: name.trim(),
      servingLabel: servingLabel.trim(),
      calories: Number(calories) || 0,
      proteinG: Number(protein) || 0,
      carbsG: Number(carbs) || 0,
      fatG: Number(fat) || 0,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Check the values');
      return;
    }
    setError(null);
    createFood.mutate(parsed.data, { onSuccess: () => router.back() });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="Custom food" />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-16 pt-2" showsVerticalScrollIndicator={false}>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Protein Pancakes"
          error={error ?? undefined}
        />
        <TextField
          label="Serving"
          value={servingLabel}
          onChangeText={setServingLabel}
          placeholder="100g / 1 scoop / 1 piece"
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Calories"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Protein (g)"
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Carbs (g)"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Fat (g)"
              value={fat}
              onChangeText={setFat}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>
        <Button label="Save food" size="lg" loading={createFood.isPending} onPress={onSave} />
      </ScrollView>
    </SafeAreaView>
  );
}
