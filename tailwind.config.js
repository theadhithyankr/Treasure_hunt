/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        treasure: {
          50: '#f0fdfa',   // Very light teal
          100: '#ccfbf1',  // Light teal
          200: '#99f6e4',  // Lighter teal
          300: '#5eead4',  // Medium light teal
          400: '#2dd4bf',  // Bright teal
          500: '#14b8a6',  // Main teal (primary)
          600: '#0d9488',  // Dark teal
          700: '#0f766e',  // Darker teal
          800: '#115e59',  // Very dark teal
          900: '#134e4a',  // Deepest teal
        },
        ocean: {
          50: '#ecfeff',   // Very light cyan
          100: '#cffafe',  // Light cyan
          200: '#a5f3fc',  // Lighter cyan
          300: '#67e8f9',  // Medium cyan
          400: '#22d3ee',  // Bright cyan
          500: '#06b6d4',  // Main cyan
          600: '#0891b2',  // Dark cyan
          700: '#0e7490',  // Darker cyan
          800: '#155e75',  // Very dark cyan
          900: '#164e63',  // Deepest cyan
        },
        gold: {
          50: '#fffbeb',   // Very light gold
          100: '#fef3c7',  // Light gold
          200: '#fde68a',  // Lighter gold
          300: '#fcd34d',  // Medium gold
          400: '#fbbf24',  // Bright gold
          500: '#f59e0b',  // Main gold
          600: '#d97706',  // Dark gold
          700: '#b45309',  // Darker gold
          800: '#92400e',  // Very dark gold
          900: '#78350f',  // Deepest gold
        },
        danger: {
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        mystery: ['"Creepster"', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.safe-area-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
