import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { calcMacroTarget, type MacroTarget } from '@gymcrush/shared';
import { ComingSoon, ScreenScaffold } from '@/components/ui/ScreenScaffold';

/**
 * Live preview of the shared calorie/macro calculator. Demonstrates that the
 * exact same math (packages/shared) runs on-device and on the server.
 */
export default function NutritionScreen() {
  const [example] = useState({
    sex: 'male' as const,
    age: 28,
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'moderate' as const,
    nutritionGoal: 'lean_bulk' as const,
  });

  const target: MacroTarget = useMemo(() => calcMacroTarget(example), [example]);

  return (
    <ScreenScaffold title="Nutrition" subtitle="Targets from your body metrics and goal.">
      <View className="gap-4 rounded-2xl border border-surface-muted bg-surface-elevated p-5">
        <Text className="text-sm font-semibold uppercase tracking-wide text-content-faint">
          Example target (80kg, lean bulk)
        </Text>
        <Text className="text-4xl font-bold text-content">{target.calories} kcal</Text>
        <View className="flex-row gap-3">
          <MacroPill label="Protein" value={`${target.proteinG}g`} />
          <MacroPill label="Carbs" value={`${target.carbsG}g`} />
          <MacroPill label="Fat" value={`${target.fatG}g`} />
        </View>
      </View>

      <ComingSoon
        items={[
          'Body profile onboarding (weight, height, activity, goal)',
          'Editable macro targets with progress rings',
          'Food search, custom foods & quick-add',
          'Bodyweight tracking with trend chart',
        ]}
      />
    </ScreenScaffold>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-1 rounded-xl bg-surface-muted p-3">
      <Text className="text-xs uppercase text-content-faint">{label}</Text>
      <Text className="text-lg font-semibold text-content">{value}</Text>
    </View>
  );
}
