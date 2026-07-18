import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/lib/theme';

const STEPS = ['goal', 'body', 'activity', 'results'];

function StepDots() {
  const pathname = usePathname();
  const current = Math.max(
    0,
    STEPS.findIndex((s) => pathname.includes(s)),
  );

  return (
    <View className="flex-row justify-center gap-2 py-4">
      {STEPS.map((step, i) => (
        <View
          key={step}
          className={`h-1.5 rounded-full ${i === current ? 'w-8 bg-brand' : 'w-1.5 bg-surface-muted'}`}
        />
      ))}
    </View>
  );
}

export default function OnboardingLayout() {
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <StepDots />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaView>
  );
}
