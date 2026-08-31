import '../global.css';

import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
  useFonts,
} from '@expo-google-fonts/figtree';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useThemeColors } from '@/lib/theme';
import { useAuthStore } from '@/features/auth/authStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { useExerciseCatalog } from '@/features/exercises/hooks';
import { useActiveSessionStore } from '@/features/workout/activeSessionStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SplashOverlay } from '@/components/ui/SplashOverlay';
import { ToastHost } from '@/components/ui/ToastHost';

SplashScreen.preventAutoHideAsync();

/** Routes between auth, onboarding, and the app based on session + profile state. */
function useProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const onboarded = useProfileStore((s) => s.onboarded);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const group = segments[0];

    if (status === 'unauthenticated') {
      if (group !== '(auth)') router.replace('/(auth)/login');
      return;
    }
    // Authenticated:
    if (!onboarded) {
      if (group !== '(onboarding)') router.replace('/(onboarding)/goal');
      return;
    }
    // Leave (onboarding) reachable when onboarded — Profile's "edit body
    // profile" re-runs the flow; results.tsx replaces back to (tabs) itself.
    if (group === '(auth)') {
      router.replace('/(tabs)');
    }
  }, [status, onboarded, segments, router]);
}

/**
 * A workout survives an app kill (the store is persisted), so drop the user back
 * into it on relaunch — otherwise the restored session sits invisible.
 */
function useResumeActiveSession() {
  const status = useAuthStore((s) => s.status);
  const onboarded = useProfileStore((s) => s.onboarded);
  const hydrated = useActiveSessionStore((s) => s.hydrated);
  const hasSession = useActiveSessionStore((s) => s.session !== null);
  const router = useRouter();
  // One redirect per launch — re-running would yank the user out of any screen
  // they open mid-workout, like the exercise picker.
  const resumed = useRef(false);

  useEffect(() => {
    if (resumed.current) return;
    if (!hydrated || status !== 'authenticated' || !onboarded) return;
    resumed.current = true;
    if (hasSession) router.replace('/workout/active');
  }, [hydrated, hasSession, status, onboarded, router]);
}

function RootNavigator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const status = useAuthStore((s) => s.status);
  const colors = useThemeColors();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useProtectedRoute();
  useResumeActiveSession();
  // Keep the synchronous exercise-lookup cache warm once signed in.
  useExerciseCatalog(status === 'authenticated');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="exercise/picker" options={{ presentation: 'modal' }} />
      <Stack.Screen name="food/search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="workout/active" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <SplashOverlay />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
