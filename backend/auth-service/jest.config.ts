//module.exports = {
//    preset: 'ts-jest',
//    testEnvironment: 'node',
//    moduleFileExtensions: ['ts', 'js', 'json'],
//    transform: {
//      '^.+\\.tsx?$': ['ts-jest', {
//        tsconfig: '../../tsconfig.json' // Reference the root tsconfig
//      }]
//    },
//    moduleNameMapper: {
//      '^@shared/(.*)$': '<rootDir>/../../shared/$1',
//      '^@backend/(.*)$': '<rootDir>/../../backend/$1'
//    },
//    testMatch: ['**/tests/**/*.test.ts'],
//    // Handle TypeScript paths properly
//    modulePaths: ['<rootDir>/../../'],
//    // Increase timeout for tests
//    testTimeout: 10000
//  };