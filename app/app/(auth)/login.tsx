import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text className="text-5xl font-black tracking-tight text-content">
            Gym<Text className="text-brand">Crush</Text>
          </Text>
          <Text className="text-base text-content-muted">Train hard. Track everything.</Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            error={error ?? undefined}
          />

          <View className="flex-row justify-end">
            <Link href="/(auth)/forgot-password" className="text-sm font-semibold text-brand">
              Forgot password?
            </Link>
          </View>

          <Button label="Log in" onPress={onSubmit} loading={loading} />
        </View>

        <View className="flex-row items-center justify-center">
          <Text className="text-content-muted">No account? </Text>
          <Link href="/(auth)/register" className="font-bold text-brand">
            Sign up
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
