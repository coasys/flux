module.exports = {
  presets: [
    "@vue/cli-plugin-babel/preset",
    "@babel/preset-typescript",
    "@babel/preset-env",
  ],
  plugins: ["@babel/plugin-transform-runtime"],
  ignore: [/\/node_modules\//],
};
