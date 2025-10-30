/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'apps/*/lib/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@nest/shared-types$': '<rootDir>/packages/shared-types/src',
    '^@nest/validation$': '<rootDir>/packages/validation/src',
    '^@nest/database$': '<rootDir>/packages/database/lib',
    '^@nest/ui$': '<rootDir>/packages/ui/components',
  },
};
