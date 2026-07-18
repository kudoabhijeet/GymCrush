/** @type {import('tailwindcss').Config} */

/** Theme-flipping tokens live as CSS variables in global.css. */
const v = (name) => `rgb(var(--gc-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Constant across themes: volt fill + what sits on it.
        brand: {
          DEFAULT: '#ccff00',
          dark: '#a6d400',
          fg: '#0a0c0b', // text/icons placed on a brand fill
          text: v('brand-text'), // links & accents — flips per theme
        },
        accent: {
          DEFAULT: '#ff5a1f',
          dark: '#e0430c',
        },
        // Theme-flipping semantic tokens.
        surface: {
          DEFAULT: v('surface'),
          elevated: v('surface-elevated'),
          muted: v('surface-muted'),
        },
        content: {
          DEFAULT: v('content'),
          muted: v('content-muted'),
          faint: v('content-faint'),
        },
        danger: v('danger'),
        warning: v('warning'),
        success: v('success'),
      },
      fontFamily: {
        body: ['Figtree_400Regular'],
        medium: ['Figtree_500Medium'],
        semibold: ['Figtree_600SemiBold'],
        bold: ['Figtree_700Bold'],
        extrabold: ['Figtree_800ExtraBold'],
        black: ['Figtree_900Black'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '22px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
