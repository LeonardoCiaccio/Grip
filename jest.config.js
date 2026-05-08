module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['core/grip.js'],
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
  restoreMocks: true
}
