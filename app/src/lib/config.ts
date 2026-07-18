import Constants from 'expo-constants';

/**
 * Base URL of the GymCrush API. Override per-environment via app.json `extra`
 * or an EXPO_PUBLIC_API_URL env var. Defaults to localhost for the simulator.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';
