import { Tabs } from 'expo-router';
import { Apple, CircleUserRound, ClipboardList, Dumbbell, House } from 'lucide-react-native';
import { useThemeColors } from '@/lib/theme';

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.scheme === 'dark' ? colors.brand : colors.brandText,
        tabBarInactiveTintColor: colors.contentFaint,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.surfaceMuted,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Figtree_600SemiBold',
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={22} strokeWidth={2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <ClipboardList size={22} strokeWidth={2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <Dumbbell size={22} strokeWidth={2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => <Apple size={22} strokeWidth={2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <CircleUserRound size={22} strokeWidth={2} color={color} />,
        }}
      />
    </Tabs>
  );
}
