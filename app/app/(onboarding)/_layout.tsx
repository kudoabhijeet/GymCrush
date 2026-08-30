import { Stack, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, X } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
import { useThemeColors } from '@/lib/theme';
import { useProfileStore } from '@/features/profile/profileStore';

const STEPS = ['goal', 'body', 'activity', 'results'] as const;

function StepChrome() {
  const pathname = usePathname();
  const router = useRouter();
  const colors = useThemeColors();
  const onboarded = useProfileStore((s) => s.onboarded);
  const current = Math.max(
    0,
    STEPS.findIndex((s) => pathname.includes(s)),
  );
  const isFirstStep = current <= 0;
  // Re-run from Profile keeps onboarded true — show a way out. First-run has no escape.
  const showChrome = onboarded || !isFirstStep;

  const onBack = () => {
    if (isFirstStep) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/profile');
      return;
    }
    router.back();
  };

  if (!showChrome) {
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

  return (
    <View className="flex-row items-center gap-2 px-4 py-2">
      <IconButton
        icon={
          isFirstStep ? (
            <X size={20} color={colors.content} />
          ) : (
            <ChevronLeft size={22} color={colors.content} />
          )
        }
        onPress={onBack}
        accessibilityLabel={isFirstStep ? 'Cancel' : 'Go back'}
        variant="plain"
      />
      <View className="flex-1 flex-row justify-center gap-2">
        {STEPS.map((step, i) => (
          <View
            key={step}
            className={`h-1.5 rounded-full ${i === current ? 'w-8 bg-brand' : 'w-1.5 bg-surface-muted'}`}
          />
        ))}
      </View>
      {/* Balance the leading button so the dots stay centered. */}
      <View className="h-10 w-10" />
    </View>
  );
}

export default function OnboardingLayout() {
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <StepChrome />
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
