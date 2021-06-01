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
        productName: "Junto",
        appId: "junto.foundation.communities",
        mac: {
          target: "tar.gz",
        },
        linux: {
          target: ["AppImage", "deb"],
          category: "Network",
          maintainer: "dev@junto.foundation",
        },
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
      nodeIntegration: false,
    },
  },
};
