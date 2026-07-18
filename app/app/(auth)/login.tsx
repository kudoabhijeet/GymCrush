import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/features/auth/authStore';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
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
            <AppText variant="display">
              Gym
              <AppText variant="display" className="text-brand-text">
                Crush
              </AppText>
            </AppText>
            <AppText variant="body" className="text-content-muted">
              Train hard. Track everything.
            </AppText>
          </View>

          <View className="gap-4">
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholder="••••••••"
              error={error ?? undefined}
              onSubmitEditing={onSubmit}
            />

            <View className="flex-row justify-end">
              <Link href="/(auth)/forgot-password" asChild>
                <AppText variant="caption" className="font-bold text-brand-text">
                  Forgot password?
                </AppText>
              </Link>
            </View>

            <Button label="Log in" size="lg" onPress={onSubmit} loading={loading} />
          </View>

          <View className="flex-row items-center justify-center">
            <AppText variant="body" className="text-content-muted">
              No account?{' '}
            </AppText>
            <Link href="/(auth)/register" asChild>
              <AppText variant="body" className="font-bold text-brand-text">
                Sign up
              </AppText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
