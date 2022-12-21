require("esbuild")
  .build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    format: "esm",
    minify: true,
    sourcemap: true,
    target: "safari11",
    outfile: "dist/main.js",
    watch: process.env.NODE_ENV === "dev" ? true : false,
  })
  .catch(() => process.exit(1));
