module.exports = {
  preset: 'ts-jest',
  rootDir: 'src',
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
