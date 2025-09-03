import { defineConfig } from "vite";
import { resolve } from "path";
import react from '@vitejs/plugin-react-swc'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "./src/main.ts"),
      name: "Main",
      fileName: "main",
    },
  },
});
