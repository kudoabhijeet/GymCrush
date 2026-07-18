import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MailCheck } from 'lucide-react-native';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useThemeColors } from '@/lib/theme';

/**
 * Password reset request. The backend endpoint is a Phase 1 TODO
 * (POST /api/auth/forgot-password → email a reset link), so this screen
 * validates input and shows a confirmation state.
 */
export default function ForgotPasswordScreen() {
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = () => {
    if (!email.trim()) return;
    // TODO(Phase 1): call authApi.forgotPassword(email) once the endpoint exists.
    setSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center gap-8 px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2">
            <AppText variant="title">Reset password</AppText>
            <AppText variant="body" className="text-content-muted">
              {sent
                ? 'If an account exists for that email, a reset link is on its way.'
                : "Enter your email and we'll send you a reset link."}
            </AppText>
          </View>

          {sent ? (
            <View className="items-center py-4">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand/15">
                <MailCheck size={28} color={colors.brandText} />
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                onSubmitEditing={onSubmit}
              />
              <Button label="Send reset link" size="lg" onPress={onSubmit} />
            </View>
          )}

          <View className="flex-row items-center justify-center">
            <AppText variant="body" className="text-content-muted">
              Remembered it?{' '}
            </AppText>
            <Link href="/(auth)/login" asChild>
              <AppText variant="body" className="font-bold text-brand-text">
                Back to login
              </AppText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
