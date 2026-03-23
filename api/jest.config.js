module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'middlewares/**/*.js',
    '!node_modules/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  bail: false,
  maxWorkers: 1,
  globals: {
    'NODE_ENV': 'test'
  }
};
