// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Enforce explicit return types on functions — helpful in Lambda handlers
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow _ prefix for intentionally unused variables
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow void returns in promise chains
      '@typescript-eslint/no-floating-promises': 'error',
      // No explicit any
      '@typescript-eslint/no-explicit-any': 'error',
      // Prefer const
      'prefer-const': 'error',
      // No console — use logger
      'no-console': 'error',
    },
  },
  {
    // Relax rules for test files
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    // Do not lint generated files
    ignores: ['src/models/external/generated.ts'],
  },
);
