/* eslint-disable */
export default {
  displayName: 'file-service',
  preset: './jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/file-service',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  testEnvironment: 'node',
  watchPathIgnorePatterns: ['globalConfig'],
};
