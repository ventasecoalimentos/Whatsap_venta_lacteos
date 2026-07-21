/* Configuración de ESLint — TypeScript strict + Prettier (ver .prettierrc.json). */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: false,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
  // dashboard-frontend/ es un proyecto Vite/React aparte, con su propio tooling — no lo cubre
  // este ESLint de backend (distinto parserOptions/env, necesitaría JSX + globals de navegador).
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', 'dashboard-frontend/'],
};
