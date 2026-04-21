import { defineConfig } from 'vite';
import { resolve } from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  // @ts-ignore
  plugins: [cssInjectedByJsPlugin()],
  build: {
    sourcemap: true,
    outDir: 'dist',
    lib: {
      entry: 'src/flux-container.ts',
      formats: ['es'],
    },
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
