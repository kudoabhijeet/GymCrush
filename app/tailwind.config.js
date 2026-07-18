/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Fitness palette: electric "volt" lime energy on a deep charcoal base,
        // with a warm energy accent. Consumed via className="bg-brand" etc.
        brand: {
          DEFAULT: '#ccff00', // volt lime — high-energy athletic primary
          dark: '#a6d400',
          soft: '#e5ff66',
        },
        accent: {
          DEFAULT: '#ff5a1f', // energy orange — secondary highlights / streaks
          dark: '#e0430c',
        },
        surface: {
          DEFAULT: '#0a0c0b', // near-black with a faint cool tint
          elevated: '#14181a',
          muted: '#1f2528',
        },
        content: {
          DEFAULT: '#f4f6f5',
          muted: '#9aa4a2',
          faint: '#5d6a67',
        },
        danger: '#ff4d4d',
        warning: '#ffb020',
        success: '#3ddc84',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '22px',
      },
    },
  },
  plugins: [],
};
