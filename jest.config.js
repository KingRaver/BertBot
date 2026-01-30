module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@agent/(.*)$': '<rootDir>/src/agent/$1',
    '^@channels/(.*)$': '<rootDir>/src/channels/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@gateway/(.*)$': '<rootDir>/src/gateway/$1',
    '^@security/(.*)$': '<rootDir>/src/security/$1',
    '^@sessions/(.*)$': '<rootDir>/src/sessions/$1',
    '^@tools/(.*)$': '<rootDir>/src/tools/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  }
};
