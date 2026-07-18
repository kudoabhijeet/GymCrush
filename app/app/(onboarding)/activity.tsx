import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ActivityLevel } from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { useOnboardingStore } from '@/features/profile/onboardingStore';

const LEVELS: { value: ActivityLevel; title: string; description: string }[] = [
  { value: 'sedentary', title: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'light', title: 'Lightly active', description: 'Training 1–3 days / week' },
  { value: 'moderate', title: 'Moderately active', description: 'Training 3–5 days / week' },
  { value: 'active', title: 'Very active', description: 'Training 6–7 days / week' },
  { value: 'very_active', title: 'Athlete', description: 'Hard training + physical job' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const activityLevel = useOnboardingStore((s) => s.activityLevel);
  const setActivity = useOnboardingStore((s) => s.setActivity);

  return (
    <View className="flex-1 justify-between pb-6">
      <ScrollView contentContainerClassName="gap-6 px-6" showsVerticalScrollIndicator={false}>
        <View className="gap-2 pt-4">
          <AppText variant="title">How active are you?</AppText>
          <AppText variant="caption">Sets the multiplier on your daily energy expenditure.</AppText>
        </View>

        <View className="gap-3">
          {LEVELS.map(({ value, title, description }) => {
            const selected = activityLevel === value;
            return (
              <PressableScale
                key={value}
                onPress={() => setActivity(value)}
                className={`flex-row items-center justify-between rounded-2xl border p-5 ${
                  selected ? 'border-brand bg-brand/10' : 'border-surface-muted bg-surface-elevated'
                }`}
              >
                <View className="gap-0.5">
                  <AppText variant="subheading">{title}</AppText>
                  <AppText variant="caption">{description}</AppText>
                </View>
                <View
                  className={`h-5 w-5 rounded-full border-2 ${
                    selected ? 'border-brand bg-brand' : 'border-surface-muted'
                  }`}
                />
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6">
        <Button
          label="See my targets"
          size="lg"
          disabled={!activityLevel}
          onPress={() => router.push('/(onboarding)/results')}
        />
      </View>
    </View>
  );
}
