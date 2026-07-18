import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useOnboardingStore } from '@/features/profile/onboardingStore';

export default function BodyScreen() {
  const router = useRouter();
  const { sex, age, heightCm, weightKg, setBody } = useOnboardingStore();

  return (
    <View className="flex-1 justify-between pb-6">
      <ScrollView contentContainerClassName="gap-6 px-6" showsVerticalScrollIndicator={false}>
        <View className="gap-2 pt-4">
          <AppText variant="title">About you</AppText>
          <AppText variant="caption">Used for the BMR/TDEE calculation — nothing else.</AppText>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <AppText variant="label">Sex</AppText>
            <SegmentedControl
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
              value={sex}
              onChange={(value) => setBody({ sex: value })}
            />
          </View>

          <Card className="flex-row items-center justify-between">
            <AppText variant="subheading">Age</AppText>
            <NumberStepper
              value={age}
              onChange={(v) => setBody({ age: v })}
              min={13}
              max={100}
            />
          </Card>

          <Card className="flex-row items-center justify-between">
            <AppText variant="subheading">Height</AppText>
            <NumberStepper
              value={heightCm}
              onChange={(v) => setBody({ heightCm: v })}
              min={120}
              max={230}
              format={(v) => `${v} cm`}
            />
          </Card>

          <Card className="flex-row items-center justify-between">
            <AppText variant="subheading">Weight</AppText>
            <NumberStepper
              value={weightKg}
              onChange={(v) => setBody({ weightKg: v })}
              step={0.5}
              min={35}
              max={250}
              format={(v) => `${v} kg`}
            />
          </Card>
        </View>
      </ScrollView>

      <View className="px-6">
        <Button label="Continue" size="lg" onPress={() => router.push('/(onboarding)/activity')} />
      </View>
    </View>
  );
}
