module.exports = {
  // Set timeout to 3 minutes if recording polly HTTP requests
  testTimeout: process.env.POLLY_MODE === 'record' ? 3 * 60 * 1000 : 5000,
  setupFilesAfterEnv: ['@scaleleap/jest-polly'],
  coveragePathIgnorePatterns: ['!*.d.ts'],
  rootDir: './src',
}
