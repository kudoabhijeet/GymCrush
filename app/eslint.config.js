// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "import/first": "off",
    },
  },
  {
    // Reanimated shared values are intentionally mutated in worklets/gestures.
    files: ["src/components/ui/BottomSheet.tsx"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  {
    // Rest timer syncs a 1Hz clock to the store deadline on mount.
    files: ["src/features/workout/components/RestTimerBar.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
