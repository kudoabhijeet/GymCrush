import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

/** Minimal emoji tab icon so the scaffold runs without an icon library yet. */
function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{symbol}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ccff00',
        tabBarInactiveTintColor: '#5d6a67',
        tabBarStyle: {
          backgroundColor: '#14181a',
          borderTopColor: '#1f2528',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon symbol="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <TabIcon symbol="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <TabIcon symbol="💪" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => <TabIcon symbol="🍎" color={color} />,
        }}
      />
    </Tabs>
  );
}
