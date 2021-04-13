module.exports = {
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      externals: ["ad4m-core-executor"],
      builderOptions: {
        productName: "Communities",
        extraResources: [
          {
            from: "resources/${os}",
            to: "Resources/bin",
            filter: ["**/*"],
          },
          {
            from: "ad4m/languages",
            to: "Resources/languages",
            filter: ["**/*"],
          },
        ],
      },
    },
  },
};
