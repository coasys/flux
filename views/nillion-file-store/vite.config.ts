import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import preact from "@preact/preset-vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dotenv from "dotenv";
import basicSsl from "@vitejs/plugin-basic-ssl";
import wasm from "vite-plugin-wasm";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createFilter } from "vite";

function replaceNillionImports() {
  const filter = createFilter("**/main.js");

  return {
    name: "replace-nillion-imports",
    enforce: "post",
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        if (filter(fileName)) {
          const chunk = bundle[fileName];
          if (chunk.type === "chunk" && typeof chunk.code === "string") {
            chunk.code = chunk.code.replace(
              /from\s+['"]@nillion\/client-web['"]/g,
              "from './nillion_client_wasm.js'"
            );
          }
        }
      }
    },
  };
}

dotenv.config();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: "./",
    define: {
      __APP_ENV__: env.APP_ENV,
    },
    plugins: [
      preact({
        babel: {
          plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties"],
          ],
        },
      }),
      viteStaticCopy({
        targets: [
          {
            src: "../../node_modules/@nillion/client-web/dist/*",
            dest: "",
          },
        ],
      }),
      cssInjectedByJsPlugin(),
      basicSsl(),
      wasm(),
      replaceNillionImports(),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, "./src/main.ts"),
        name: "Main",
        fileName: "main",
        formats: ["es"],
      },
      minify: false,
      rollupOptions: {
        external: ["@nillion/client-web"],
      },
    },
    lib: ["esm"],
    optimizeDeps: {
      exclude: ["@nillion/client-web"],
    },
    assetsInclude: ["**/*.wasm", "**/*.worker.js"],
    server: {
      fs: {
        strict: false,
      },
      proxy: {
        "/nilchain-proxy": {
          target: process.env.VITE_NILLION_NILCHAIN_JSON_RPC,
          rewrite: (path) => path.replace(/^\/nilchain-proxy/, ""),
          changeOrigin: true,
          secure: false,
        },
      },
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },
  };
});
