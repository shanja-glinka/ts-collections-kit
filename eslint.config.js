import eslintPlugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.eslintrc.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': eslintPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/ban-ts-comment': 'error',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['src/tests/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
