import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';

const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/package-lock.json',
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      // App Router project — pages/ directory rule doesn't apply
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    // API server logs intentionally via console
    files: ['apps/api/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  prettier,
];

export default config;
