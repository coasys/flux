module.exports = {
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      externals: ["ad4m-executor", "fs"],
      builderOptions: {
        productName: "Communities",
        extraResources: [
          {
            from: "./resources/${os}",
            to: "packaged-resources/bin",
            filter: ["**/*"],
          },
          {
            from: "./ad4m/languages",
            to: "packaged-resources/languages",
            filter: ["**/*"],
          },
        ],
      },
    },
  },
};
