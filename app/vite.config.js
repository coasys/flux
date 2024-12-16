import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import babel from "vite-plugin-babel-compiler";
import fs from "fs-extra";
import basicSsl from "@vitejs/plugin-basic-ssl";

function copyNillionFileStore() {
  return {
    name: "copy-nillion-file-store",
    async writeBundle() {
      const src = "../views/nillion-file-store/dist";
      const dest = "dist/@coasys/nillion-file-store";
      await fs.copy(src, dest);
      console.log(`Copied @coasys/nillion-file-store from ${src} to ${dest}`);
    },
  };
}

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    base: process.env.VITE_BASE || "/",
    plugins: [
      babel({
        babel: {
          plugins: [
            [
              "@babel/plugin-proposal-decorators",
              { decoratorsBeforeExport: true },
            ],
          ],
        },
      }),

      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => {
              return (
                tag.startsWith("j-") ||
                tag === "perspective-view" ||
                tag === "ad4m-connect" ||
                tag === "chat-view" ||
                tag === "graph-view" ||
                tag === "webrtc-view" ||
                tag === "webrtc-debug-view" ||
                tag === "post-view"
              );
            },
          },
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
          /* other options */
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 5000000, // cache files upto 5mb since our index.js is around 3.4mb
        },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "Flux",
          short_name: "Flux",
          description: "A social media toolkit",
          display_override: ["window-controls-overlay"],
          theme_color: "#222",
          background_color: "#222",
          icons: [
            {
              src: "images/icons/icon-72x72.png",
              sizes: "72x72",
              type: "image/png",
            },
            {
              src: "images/icons/icon-92x92.png",
              sizes: "92x92",
              type: "image/png",
            },
            {
              src: "images/icons/icon-128x128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "images/icons/icon-144x144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "images/icons/icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
            },
            {
              src: "images/icons/icon-196x196.png",
              sizes: "196x196",
              type: "image/png",
            },
            {
              src: "images/icons/icon-256x256.png",
              sizes: "256x256",
              type: "image/png",
            },
            {
              src: "images/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
      copyNillionFileStore(),
      basicSsl(),
    ],
    build: {
      rollupOptions: {
        external: ["@coasys/nillion-file-store", "@nillion/client-web"],
      },
    },
    optimizeDeps: {
      exclude: ["@coasys/nillion-file-store", "@nillion/client-web"],
    },
    define: {
      "process.env": {},
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@coasys/nillion-file-store": path.resolve(
          __dirname,
          "../node_modules/@coasys/nillion-file-store/dist/main.js"
        ),
      },
    },
    server: {
      port: 3030,
      proxy: {
        "/nilchain-proxy": {
          target: "http://65.109.222.111:26657",
          rewrite: (path) => path.replace(/^\/nilchain-proxy/, ""),
          changeOrigin: true,
          secure: false,
        },
        "/icon.png": {
          target: "https://i.ibb.co/GnqjPJP/icon.png",
          rewrite: (path) => path.replace(/^\/icon.png/, ""),
          changeOrigin: true,
          secure: false,
        },
      },
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },
  });
};
