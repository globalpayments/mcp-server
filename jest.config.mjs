/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/tests/**',
    '!src/index.ts', 
    '!src/core/index.ts', 
    '!src/api/**', 
    '!src/core/server.ts',
    '!src/clients/**',
    '!src/tools/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleDirectories: ['node_modules', 'src'],
};
