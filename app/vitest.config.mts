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
    alias: {
      '@': path.resolve(root, 'src'),
      // The Live Activity layout is a pure (props, environment) -> node tree
      // function, so it *is* testable here — but only against the widget
      // extension's runtime rather than React's. These three aliases stand in
      // for what `expo-widgets` provides inside the extension: SwiftUI views and
      // modifiers as plain records, and a JSX runtime that calls function
      // components instead of building React elements. Metro applies the same
      // swiftUiStub alias for the app bundle (see metro.config.js).
      'react/jsx-runtime': path.resolve(root, 'src/lib/widgetJsxRuntime.ts'),
      'react/jsx-dev-runtime': path.resolve(root, 'src/lib/widgetJsxRuntime.ts'),
      '@expo/ui/swift-ui/modifiers': path.resolve(root, 'src/lib/swiftUiStub.ts'),
      '@expo/ui/swift-ui': path.resolve(root, 'src/lib/swiftUiStub.ts'),
    },
  },
});
