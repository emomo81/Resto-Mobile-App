/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1A1A2E',
          light: '#242442',
          dark: '#12121F',
        },
        amber: {
          DEFAULT: '#E2A04A',
          light: '#F0C078',
          dark: '#C8863A',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          dark: '#F5EDE0',
        },
        accent: {
          red: '#C0392B',
        },
      },
      fontFamily: {
        'heading': ['PlayfairDisplay_700Bold'],
        'heading-medium': ['PlayfairDisplay_500Medium'],
        'body': ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
        'body-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
