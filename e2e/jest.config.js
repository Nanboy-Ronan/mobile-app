module.exports = {
  setupFilesAfterEnv: ['detox/runners/jest/setup'],
  testTimeout: 120000,
  reporters: ['detox/runners/jest/reporter']
};
