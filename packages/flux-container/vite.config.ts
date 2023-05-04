import { PluginOption, defineConfig } from "vite";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  // @ts-ignore
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: "build",
    lib: {
      entry: "src/flux-container.ts",
      formats: ["es"],
    },
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  // plugins: [
  //   visualizer({
  //     template: "treemap", // or sunburst
  //     open: true,
  //     gzipSize: true,
  //     brotliSize: true,
  //     filename: "analice.html",
  //   }) as PluginOption,
  // ],
});
