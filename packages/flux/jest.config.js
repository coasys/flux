/* eslint-disable */

const { pathsToModuleNameMapper } = require("ts-jest/utils");
const { compilerOptions } = require("./tsconfig");

const esModules = [
  "runtime-dom",
  "vue3-observe-visibility2",
  "vue3-virtual-scroller",
].join("|");

module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["js", "ts", "json", "vue"],
  testEnvironment: "node",
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths),
    "\\.(css|less)$": "<rootDir>/src/__tests__/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "jest-transform-stub",
  },
  modulePaths: ["<rootDir>"],
  transform: {
    ".*\\.(vue)$": "vue-jest",
    [`(${esModules}).+\\.js$`]: "babel-jest",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "jest-transform-stub",
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  testPathIgnorePatterns: ["<rootDir>/src/__tests__/__mocks__"],
  globals: {
    window: {},
    define: () => {},
  },
  setupFiles: ["./jest.setup.js"]
};
