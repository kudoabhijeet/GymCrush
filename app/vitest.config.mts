import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = import.meta.dirname;

/**
 * Vitest covers the app's *logic* modules — stores, lib/ helpers — which are
 * plain TS and only touch native modules through mockable imports.
 *
 * It deliberately does not render components: that needs the jest-expo
 * transform stack (NativeWind, Reanimated, the Expo module registry), which is
 * a separate setup. Keep component behaviour out of here rather than reaching
 * for heavier and heavier mocks.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(root, 'src') },
  },
});
