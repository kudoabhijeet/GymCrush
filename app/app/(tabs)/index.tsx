import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ComingSoon, ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { useAuthStore } from '@/features/auth/authStore';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <ScreenScaffold
      title={user ? `Hey, ${user.displayName}` : 'Welcome'}
      subtitle="Your training at a glance."
    >
      <View className="gap-3 rounded-2xl bg-brand p-5">
        <Text className="text-sm font-semibold uppercase tracking-wide text-black/70">Today</Text>
        <Text className="text-2xl font-bold text-black">No workout scheduled</Text>
        <Text className="text-black/80">Pick a plan to get started, or log a freestyle session.</Text>
      </View>

      <ComingSoon
        items={[
          'Next workout & streak card',
          "Today's macro rings",
          'Recent sessions & PRs',
          'Weekly volume snapshot',
        ]}
      />

      <Button label="Log out" variant="secondary" onPress={logout} />
    </ScreenScaffold>
  );
}
