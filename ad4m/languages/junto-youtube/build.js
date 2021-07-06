const esbuild = require("esbuild");
const inlineImportPlugin = require("esbuild-plugin-inline-import");

esbuild
  .build({
    entryPoints: ["index.ts"],
    bundle: true,
    outfile: "build/bundle.js",
    plugins: [inlineImportPlugin()],
  })
  .catch(() => process.exit(1));
