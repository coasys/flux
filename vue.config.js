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
      mainProcessFile: "src/main-thread/mainThread.ts",
      mainProcessWatch: [
        "src/main-thread/appHooks.ts",
        "src/main-thread/createUI.ts",
        "src/main-thread/globals.ts",
        "src/main-thread/ipcHooks.ts",
        "src/main-thread/setup.ts",
        "src/main-thread/updateHooks.ts",
      ],
      rendererProcessFile: "src/app.ts",
      preload: "src/preload.js",
      externals: ["@perspect3vism/ad4m-executor", "fs"],
      builderOptions: {
        productName: "Junto",
        appId: "junto.foundation.communities",
        mac: {
          target: "default",
          binaries: [
            "./resources/darwin/hc",
            "./resources/darwin/holochain",
            "./resources/darwin/lair-keystore",
          ],
        },
        linux: {
          target: ["AppImage", "deb"],
          category: "Network",
          maintainer: "dev@junto.foundation",
        },
        extraResources: [
          {
            from: "./resources/${platform}",
            to: "packaged-resources/bin",
            filter: ["**/*"],
          },
          {
            from: "./ad4m/languages",
            to: "packaged-resources/languages",
            filter: ["**/build/bundle.js", "**/*.dna"],
          },
        ],
        publish: ["github"],
      },
      nodeIntegration: false,
      chainWebpackMainProcess: (config) => {
        config.module
          .rule("babel")
          .use("babel")
          .loader("babel-loader")
          .options({
            presets: [["@babel/preset-env", { modules: false }]],
            plugins: ["@babel/plugin-transform-typescript"],
          });
      },
    },
  },
};
