import { vi } from 'vitest';

/**
 * Native modules that can't load outside a device build. Mocked here rather
 * than per-file so a test importing a store two levels deep doesn't have to
 * know which native leaves it pulls in.
 *
 * `expo-notifications` is deliberately NOT mocked here — the notification tests
 * assert against a fake scheduler and want to own it.
 */

vi.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (spec: Record<string, unknown>) => spec.ios ?? spec.default },
}));

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(async () => {}),
  notificationAsync: vi.fn(async () => {}),
  selectionAsync: vi.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

vi.mock('nativewind', () => ({
  colorScheme: { set: vi.fn(), get: vi.fn(() => 'dark') },
  useColorScheme: () => ({ colorScheme: 'dark' }),
}));

vi.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    createMMKV: () => ({
      getString: (k: string) => store.get(k),
      set: (k: string, v: string) => store.set(k, v),
      remove: (k: string) => store.delete(k),
      clearAll: () => store.clear(),
    }),
  };
});

vi.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: async (k: string) => store.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => void store.set(k, v),
    deleteItemAsync: async (k: string) => void store.delete(k),
  };
});
