import { defineConfig } from "vite";
import { resolve } from "path";
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('j-')
        }
      }
    }),
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
