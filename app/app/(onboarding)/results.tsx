import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Info } from 'lucide-react-native';
import {
  calcMacroTarget,
  wasMacroTargetClamped,
  type UpsertBodyProfileInput,
} from '@gymcrush/shared';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { durations } from '@/lib/motion';
import { useThemeColors } from '@/lib/theme';
import { useOnboardingStore } from '@/features/profile/onboardingStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { useUpsertBodyProfile } from '@/features/nutrition/hooks';

export default function ResultsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const draft = useOnboardingStore();
  const setBodyProfile = useProfileStore((s) => s.setBodyProfile);
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);
  const upsertProfile = useUpsertBodyProfile();
  const [error, setError] = useState<string | null>(null);

  const profile: UpsertBodyProfileInput = useMemo(
    () => ({
      sex: draft.sex,
      age: draft.age,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      activityLevel: draft.activityLevel ?? 'moderate',
      nutritionGoal: draft.nutritionGoal ?? 'maintain',
    }),
    [draft],
  );

  // Local preview of the targets; the server returns the authoritative values.
  const target = useMemo(() => calcMacroTarget(profile), [profile]);
  const clamped = useMemo(() => wasMacroTargetClamped(profile), [profile]);
  const macroKcal = {
    protein: target.proteinG * 4,
    carbs: target.carbsG * 4,
    fat: target.fatG * 9,
  };

  const onFinish = async () => {
    setError(null);
    try {
      const { profile: saved, target: savedTarget } = await upsertProfile.mutateAsync(profile);
      setBodyProfile(saved, savedTarget);
      completeOnboarding();
      router.replace('/(tabs)');
    } catch {
      setError("Couldn't save your profile. Check your connection and try again.");
    }
  };

  return (
    <View className="flex-1 justify-between px-6 pb-6">
      <View className="gap-6">
        <View className="gap-2 pt-4">
          <AppText variant="title">Your daily targets</AppText>
          <AppText variant="caption">
            Mifflin-St Jeor BMR × activity, adjusted for your goal. Editable anytime in Profile.
          </AppText>
        </View>

        <View className="items-center py-2">
          <ProgressRing progress={1} size={190} strokeWidth={14}>
            <View className="items-center">
              <AppText variant="display">{target.calories}</AppText>
              <AppText variant="label">kcal / day</AppText>
            </View>
          </ProgressRing>
        </View>

        <Card className="gap-4">
          <MacroRow
            label="Protein"
            grams={target.proteinG}
            share={macroKcal.protein / target.calories}
            fill="bg-brand"
            delayIndex={0}
          />
          <MacroRow
            label="Carbs"
            grams={target.carbsG}
            share={macroKcal.carbs / target.calories}
            fill="bg-accent"
            delayIndex={1}
          />
          <MacroRow
            label="Fat"
            grams={target.fatG}
            share={macroKcal.fat / target.calories}
            fill="bg-warning"
            delayIndex={2}
          />
        </Card>

        {clamped ? (
          <View className="flex-row items-start gap-2.5 rounded-xl bg-warning/10 p-3">
            <Info size={15} color={colors.warning} style={{ marginTop: 1 }} />
            <AppText variant="caption" className="flex-1 text-warning">
              Protein and fat were scaled down to fit your calorie target. At this bodyweight and
              deficit the usual per-kg amounts wouldn&apos;t leave room for carbs.
            </AppText>
          </View>
        ) : null}
      </View>

      <View className="gap-2">
        {error ? (
          <AppText variant="caption" className="text-center text-danger">
            {error}
          </AppText>
        ) : null}
        <Button label="Let's go" size="lg" loading={upsertProfile.isPending} onPress={onFinish} />
      </View>
    </View>
  );
}

function MacroRow({
  label,
  grams,
  share,
  fill,
  delayIndex = 0,
}: {
  label: string;
  grams: number;
  share: number;
  fill: string;
  /** Staggers the row's entrance — first row lands, the next two follow. */
  delayIndex?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delayIndex * 60).duration(durations.enter)}
      className="gap-2"
    >
      <View className="flex-row items-baseline justify-between">
        <AppText variant="subheading">{label}</AppText>
        <AppText variant="caption">
          <AppText className="font-extrabold text-[15px] text-content">{grams}g</AppText>
          {'  ·  '}
          {Math.round(share * 100)}%
        </AppText>
      </View>
      <ProgressBar progress={share} fillClassName={fill} height={6} />
    </Animated.View>
  );
}
