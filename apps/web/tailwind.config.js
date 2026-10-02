/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f6fc',
          100: '#e6edf8',
          200: '#cfdbef',
          300: '#acbfdf',
          400: '#829dca',
          500: '#617db3',
          600: '#4a639a',
          700: '#2b4268',
          800: '#1f3252',
          900: '#172744',
          950: '#0f1b30',
        },
        ink: {
          DEFAULT: '#101828',
          soft: '#475467',
          mute: '#98a2b3',
        },
        surface: '#f5f7fa',
        line: '#e6eaf1',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.05)',
        'card-hover': '0 12px 28px -10px rgba(16, 24, 40, 0.18)',
        navy: '0 8px 20px -8px rgba(31, 50, 82, 0.45)',
      },
    },
  },
  plugins: [],
};
