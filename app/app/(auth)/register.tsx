import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/features/auth/authStore';

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
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
            <AppText variant="title">Create account</AppText>
            <AppText variant="body" className="text-content-muted">
              Start your first plan today.
            </AppText>
          </View>

          <View className="gap-4">
            <TextField
              label="Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              placeholder="Alex"
            />
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={error ?? undefined}
              onSubmitEditing={onSubmit}
            />
            <Button label="Sign up" size="lg" onPress={onSubmit} loading={loading} />
          </View>

          <View className="flex-row items-center justify-center">
            <AppText variant="body" className="text-content-muted">
              Already have an account?{' '}
            </AppText>
            <Link href="/(auth)/login" asChild>
              <AppText variant="body" className="font-bold text-brand-text">
                Log in
              </AppText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
