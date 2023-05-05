(async () => {
  let esbuild = require("esbuild");

  let ctx = await esbuild
    .context({
      entryPoints: ["./lib/main.ts"],
      bundle: true,
      outdir: "dist",
    })
    .catch(() => process.exit(1));

  await ctx.watch();

  console.log("Watching for changes");
})();
