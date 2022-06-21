module.exports = {
  presets: [
    "@babel/preset-typescript",
  ],
  plugins: ["@babel/plugin-transform-runtime"],
  ignore: [/\/node_modules\//],
  exclude: [/\bcore-js\b/],
};
