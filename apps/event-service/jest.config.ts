/* eslint-disable */
export default {
  displayName: 'event-service',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/event-service',
  testEnvironment: 'node',
};