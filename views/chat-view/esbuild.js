const { sassPlugin, postcssModules } = require("esbuild-sass-plugin");

const preactCompatPlugin = {
  name: "preact-compat",
  setup(build) {
    const path = require("path");
    const preact = path.join(
      `${process.cwd()}/../../`,
      "node_modules",
      "preact",
      "compat",
      "dist",
      "compat.module.js"
    );

    build.onResolve({ filter: /^(react-dom|react)$/ }, (args) => {
      return { path: preact };
    });
  },
};

require("esbuild")
  .build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    format: "esm",
    minify: true,
    sourcemap: true,
    target: ["safari11"],
    outfile: "dist/main.js",
    watch: process.env.NODE_ENV === "dev" ? true : false,
    inject: ["./preact-shim.js"],

    plugins: [
      preactCompatPlugin,
      sassPlugin({
        transform: postcssModules({}),
      }),
    ],
  })
  .catch(() => process.exit(1));
