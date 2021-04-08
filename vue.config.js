module.exports = {
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: (config) => {
        // Chain webpack config for electron main process only
        //config.module.rule("typescript").use("babel-loader").loader("babel-loader");
        // config.module
        //   .rule("core-typescript")
        //   .use("ts-loader")
        //   .loader("ts-loader")
        //   .options({
        //     configFile: __dirname + "/core.tsconfig.json",
        //   });
        // config
        //   .entry("core")
        //   .add(__dirname + "/src/core/create.ts")
        //   .end()
        //   // Modify output settings
        //   .output.path(__dirname + "/core_dist")
        //   .filename("[name].bundle.js");
        // return config;
      },
      preload: "src/preload.js",
      externals: ["ad4m-core-executor"],
    },
  },
};
