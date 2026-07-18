import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text className="text-4xl font-black tracking-tight text-content">Create account</Text>
          <Text className="text-base text-content-muted">Start your first plan today.</Text>
        </View>

        <View className="gap-4">
          <TextField label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Alex" />
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
            placeholder="At least 8 characters"
            error={error ?? undefined}
          />
          <Button label="Sign up" onPress={onSubmit} loading={loading} />
        </View>

        <View className="flex-row items-center justify-center">
          <Text className="text-content-muted">Already have an account? </Text>
          <Link href="/(auth)/login" className="font-bold text-brand">
            Log in
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
