module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['Grip.js', 'functions/**/*.js'],
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
  restoreMocks: true
}
