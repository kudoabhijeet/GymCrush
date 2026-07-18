import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

/**
 * Password reset request. The backend endpoint is a Phase 1 TODO
 * (POST /api/auth/forgot-password → email a reset link), so for now this
 * screen validates input and shows a confirmation state.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = () => {
    if (!email.trim()) return;
    // TODO(Phase 1): call authApi.forgotPassword(email) once the endpoint exists.
    setSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text className="text-4xl font-black tracking-tight text-content">Reset password</Text>
          <Text className="text-base text-content-muted">
            {sent
              ? 'If an account exists for that email, a reset link is on its way.'
              : "Enter your email and we'll send you a reset link."}
          </Text>
        </View>

        {!sent && (
          <View className="gap-4">
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Button label="Send reset link" onPress={onSubmit} />
          </View>
        )}

        <View className="flex-row items-center justify-center">
          <Text className="text-content-muted">Remembered it? </Text>
          <Link href="/(auth)/login" className="font-bold text-brand">
            Back to login
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
