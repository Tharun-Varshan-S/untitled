module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
  // BullMQ keeps Redis connections open after Worker/Queue.close() on shared
  // module-level singletons. forceExit ensures the process exits after all
  // tests complete without hanging on open handles.
  forceExit: true,
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/$1'
  },
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  }
};
