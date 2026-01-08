/**
 * Jest configuration.
 *
 * This project is ESM (`"type": "module"`), but Jest config is provided in CJS format for compatibility.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.spec.ts'],
  verbose: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.tests.cjs.json' }],
  },
};
