// vite.config.ts
import { defineConfig } from "file:///Users/leifriksheim/apps/flux/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import preact from "file:///Users/leifriksheim/apps/flux/node_modules/@preact/preset-vite/dist/esm/index.mjs";
import cssInjectedByJsPlugin from "file:///Users/leifriksheim/apps/flux/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
var __vite_injected_original_dirname = "/Users/leifriksheim/apps/flux/views/graph-view";
var vite_config_default = defineConfig({
  plugins: [
    preact({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties"]
        ]
      }
    }),
    cssInjectedByJsPlugin()
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__vite_injected_original_dirname, "./src/main.ts"),
      name: "Main",
      fileName: "main"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGVpZnJpa3NoZWltL2FwcHMvZmx1eC92aWV3cy9ncmFwaC12aWV3XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGVpZnJpa3NoZWltL2FwcHMvZmx1eC92aWV3cy9ncmFwaC12aWV3L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9sZWlmcmlrc2hlaW0vYXBwcy9mbHV4L3ZpZXdzL2dyYXBoLXZpZXcvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgcHJlYWN0IGZyb20gXCJAcHJlYWN0L3ByZXNldC12aXRlXCI7XG5pbXBvcnQgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1jc3MtaW5qZWN0ZWQtYnktanNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHByZWFjdCh7XG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgW1wiQGJhYmVsL3BsdWdpbi1wcm9wb3NhbC1kZWNvcmF0b3JzXCIsIHsgbGVnYWN5OiB0cnVlIH1dLFxuICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tcHJvcG9zYWwtY2xhc3MtcHJvcGVydGllc1wiXSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luKCksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgZW1wdHlPdXREaXI6IGZhbHNlLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL21haW4udHNcIiksXG4gICAgICBuYW1lOiBcIk1haW5cIixcbiAgICAgIGZpbGVOYW1lOiBcIm1haW5cIixcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRULFNBQVMsb0JBQW9CO0FBQ3pWLFNBQVMsZUFBZTtBQUN4QixPQUFPLFlBQVk7QUFDbkIsT0FBTywyQkFBMkI7QUFIbEMsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsT0FBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFVBQ1AsQ0FBQyxxQ0FBcUMsRUFBRSxRQUFRLEtBQUssQ0FBQztBQUFBLFVBQ3RELENBQUMseUNBQXlDO0FBQUEsUUFDNUM7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxzQkFBc0I7QUFBQSxFQUN4QjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLElBQ2IsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLGVBQWU7QUFBQSxNQUN6QyxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
