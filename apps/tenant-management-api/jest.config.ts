/* eslint-disable */
export default {
  displayName: 'tenant-management-api',
  preset: './jest.preset.js',
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/tsconfig.spec.json' },
  },
  coverageDirectory: '../../coverage/apps/tenant-management-api',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  testEnvironment: 'node',
  setupFiles: ['./.jest/setEnvVars.js'],
};
