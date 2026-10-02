/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf7f2',
          100: '#f3ece1',
          200: '#e6d7c3',
          300: '#d5bb9c',
          400: '#c19a73',
          500: '#b18256',
          600: '#a4714a',
          700: '#895c40',
          800: '#6f4c39',
          900: '#5b3f31',
          950: '#31201a',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#4b5563',
          mute: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
