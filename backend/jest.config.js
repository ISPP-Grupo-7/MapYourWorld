/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.service.ts",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  
};