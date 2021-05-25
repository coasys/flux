module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        return {
          ...options,
          compilerOptions: {
            isCustomElement: (tag) => /^j-/.test(tag),
          },
        };
      });
  },
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      externals: ["@perspect3vism/ad4m-executor", "fs"],
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
