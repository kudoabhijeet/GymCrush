import { Alert, Linking, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LifeBuoy, Mail } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useThemeColors } from '@/lib/theme';

const SUPPORT_EMAIL = 'support@gymcrush.app';

export default function ReportProblemScreen() {
  const colors = useThemeColors();
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const diagnostics = `App version: ${appVersion}\nPlatform: ${Platform.OS} ${Platform.Version}`;

  const openMail = async () => {
    const subject = encodeURIComponent('GymCrush issue report');
    const body = encodeURIComponent(
      `Describe what happened and what you expected instead:\n\n\n---\n${diagnostics}`,
    );
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('No mail app found', `Email us directly at ${SUPPORT_EMAIL}.`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title="Report a problem" />
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-16 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <Card className="items-center gap-3 py-6">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand/15">
            <LifeBuoy size={24} color={colors.brandText} />
          </View>
          <AppText variant="heading">Something not working?</AppText>
          <AppText variant="body" className="text-center text-content-muted">
            Tell us what went wrong and we will look into it. The more detail you give — what you
            tapped, what you expected, what happened instead — the faster we can fix it.
          </AppText>
        </Card>

        <Button
          label="Email support"
          size="lg"
          icon={<Mail size={18} color={colors.brandFg} />}
          onPress={openMail}
        />

        <View className="gap-2">
          <AppText variant="label">Included with your report</AppText>
          <Card className="gap-1">
            <AppText variant="caption">App version {appVersion}</AppText>
            <AppText variant="caption">
              Platform {Platform.OS} {String(Platform.Version)}
            </AppText>
          </Card>
        </View>

        <AppText variant="caption" className="text-center">
          Or email us directly at {SUPPORT_EMAIL}
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
