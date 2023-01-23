import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: "dist",
    sourcemap: true,
    lib: {
      entry: {
        api: resolve(__dirname, "api/index.ts"),
        react: resolve(__dirname, "react/index.ts"),
        constants: resolve(__dirname, "constants/index.ts"),
        helpers: resolve(__dirname, "helpers/index.ts"),
        types: resolve(__dirname, "types/index.ts"),
      },
      fileName: "[name]",
      formats: ["cjs", "es"],
    },
    rollupOptions: {
      external: ["react"],
    },
  },
});
