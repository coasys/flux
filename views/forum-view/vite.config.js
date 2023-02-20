import { defineConfig } from "vite";
import { resolve } from "path";
import preact from "@preact/preset-vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    preact({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties"],
        ],
      },
    }),
    cssInjectedByJsPlugin(),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/main.ts"),
      name: "ForumView",
      // the proper extensions will be added
      fileName: "main",
    },
  },
});
