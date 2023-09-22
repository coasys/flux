(async () => {
  let esbuild = require("esbuild");

  let { copy } = require("esbuild-plugin-copy");

  let {
    minifyHTMLLiteralsPlugin,
  } = require("esbuild-plugin-minify-html-literals");

  let results = await esbuild
    .build({
      entryPoints: ["./lib/main.ts"],
      metafile: true,
      bundle: true,
      format: "esm",
      treeShaking: true,
      minify: true,
      sourcemap: true,
      target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
      outfile: "dist/main.js",
      plugins: [
        minifyHTMLLiteralsPlugin(),
        copy({
          assets: [
            {
              from: ["./lib/themes/**/*"],
              to: ["./themes"],
            },
          ],
        }),
      ],
    })
    .catch(() => process.exit(1));

  // Report results
  let resultText = await esbuild.analyzeMetafile(results.metafile);
  console.log(resultText);

  // Create meta.json file
  require("fs").writeFileSync("meta.json", JSON.stringify(results.metafile));
})();
