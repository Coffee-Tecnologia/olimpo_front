// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import importHelpers from 'eslint-plugin-import-helpers';

export default defineConfig([
  {
    ignores: ['node_modules', '.next', 'dist'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        React: 'writable',
        process: 'readonly',
      },
    },
    extends: [],
    plugins: {
      js,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      '@next/next': next,
      prettier: eslintPluginPrettier,
      'import-helpers': {
        name: 'import-helpers',
        ...importHelpers,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Next.js não precisa importar React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'warn',
      camelcase: 'error',
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
      'no-console': 'warn',
      'no-alert': 'error',
      'no-debugger': 'warn',
      semi: ['error', 'always'],
      'no-multi-spaces': ['warn', { ignoreEOLComments: true }],
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-inline-comments': 'warn',
      eqeqeq: 'error',
      'import/no-unresolved': 'off', // <- no-unresolved
      'import-helpers/order-imports': [
        'warn',
        {
          newlinesBetween: 'always',
          groups: [
            ['/^next/', '/^react/', '/@next/'],
            'module',
            '/components/',
            '/^@shared/',
            '/absolute/',
            ['parent', 'sibling', 'index'],
          ],
          alphabetize: { order: 'asc', ignoreCase: true },
        },
      ],
    },
  },
  tseslint.configs.recommended[0],
]);
