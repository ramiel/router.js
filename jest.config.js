module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**'],
  coveragePathIgnorePatterns: ['/node_modules/', 'src/mocks', 'src/compose'],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
};
