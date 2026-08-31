import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Scale, TrendingUp } from 'lucide-react-native';
import type { NutritionGoal } from '@gymcrush/shared';
import { useThemeColors } from '@/lib/theme';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { useOnboardingStore } from '@/features/profile/onboardingStore';

const GOALS: {
  value: NutritionGoal;
  title: string;
  description: string;
  Icon: typeof Flame;
}[] = [
  {
    value: 'cut',
    title: 'Lose fat',
    description: 'Calorie deficit while protecting muscle mass.',
    Icon: Flame,
  },
  {
    value: 'maintain',
    title: 'Maintain',
    description: 'Recomp at your current weight — train hard, eat at maintenance.',
    Icon: Scale,
  },
  {
    value: 'lean_bulk',
    title: 'Build muscle',
    description: 'Lean surplus for steady muscle gain with minimal fat.',
    Icon: TrendingUp,
  },
];

export default function GoalScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const goal = useOnboardingStore((s) => s.nutritionGoal);
  const setGoal = useOnboardingStore((s) => s.setGoal);

  return (
    <View className="flex-1 justify-between px-6 pb-6">
      <View className="gap-6">
        <View className="gap-2 pt-4">
          <AppText variant="title">What&apos;s your goal?</AppText>
          <AppText variant="caption">This drives your calorie and macro targets.</AppText>
        </View>

        <View className="gap-3">
          {GOALS.map(({ value, title, description, Icon }) => {
            const selected = goal === value;
            return (
              <PressableScale
                key={value}
                onPress={() => setGoal(value)}
                className={`flex-row items-center gap-4 rounded-2xl border p-5 ${
                  selected ? 'border-brand bg-brand/10' : 'border-surface-muted bg-surface-elevated'
                }`}
              >
                <View
                  className={`h-12 w-12 items-center justify-center rounded-xl ${
                    selected ? 'bg-brand' : 'bg-surface-muted'
                  }`}
                >
                  <Icon size={22} color={selected ? colors.brandFg : colors.contentMuted} />
                </View>
                <View className="flex-1 gap-0.5">
                  <AppText variant="subheading">{title}</AppText>
                  <AppText variant="caption">{description}</AppText>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <Button
        label="Continue"
        size="lg"
        disabled={!goal}
        onPress={() => router.push('/(onboarding)/body')}
      />
    </View>
  );
}
