// vite.config.js
import { defineConfig } from "file:///Users/leifriksheim/apps/flux/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import preact from "file:///Users/leifriksheim/apps/flux/node_modules/@preact/preset-vite/dist/esm/index.mjs";
import cssInjectedByJsPlugin from "file:///Users/leifriksheim/apps/flux/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
var __vite_injected_original_dirname = "/Users/leifriksheim/apps/flux/views/post-view";
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
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/main.ts"),
      name: "ForumView",
      fileName: "main"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGVpZnJpa3NoZWltL2FwcHMvZmx1eC92aWV3cy9wb3N0LXZpZXdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9sZWlmcmlrc2hlaW0vYXBwcy9mbHV4L3ZpZXdzL3Bvc3Qtdmlldy92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbGVpZnJpa3NoZWltL2FwcHMvZmx1eC92aWV3cy9wb3N0LXZpZXcvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgcHJlYWN0IGZyb20gXCJAcHJlYWN0L3ByZXNldC12aXRlXCI7XG5pbXBvcnQgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1jc3MtaW5qZWN0ZWQtYnktanNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHByZWFjdCh7XG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgW1wiQGJhYmVsL3BsdWdpbi1wcm9wb3NhbC1kZWNvcmF0b3JzXCIsIHsgbGVnYWN5OiB0cnVlIH1dLFxuICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tcHJvcG9zYWwtY2xhc3MtcHJvcGVydGllc1wiXSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luKCksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL21haW4udHNcIiksXG4gICAgICBuYW1lOiBcIkZvcnVtVmlld1wiLFxuICAgICAgZmlsZU5hbWU6IFwibWFpblwiLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVQsU0FBUyxvQkFBb0I7QUFDdFYsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLDJCQUEyQjtBQUhsQyxJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxPQUFPO0FBQUEsUUFDTCxTQUFTO0FBQUEsVUFDUCxDQUFDLHFDQUFxQyxFQUFFLFFBQVEsS0FBSyxDQUFDO0FBQUEsVUFDdEQsQ0FBQyx5Q0FBeUM7QUFBQSxRQUM1QztBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsYUFBYTtBQUFBLE1BQ3ZDLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
