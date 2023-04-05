// vite.config.ts
import { defineConfig } from "file:///Users/leifriksheim/apps/flux/packages/utils/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import react from "file:///Users/leifriksheim/apps/flux/node_modules/@vitejs/plugin-react/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/leifriksheim/apps/flux/packages/utils";
var vite_config_default = defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: "dist",
    sourcemap: true,
    lib: {
      entry: {
        api: resolve(__vite_injected_original_dirname, "api/index.ts"),
        constants: resolve(__vite_injected_original_dirname, "constants/index.ts"),
        helpers: resolve(__vite_injected_original_dirname, "helpers/index.ts"),
        factory: resolve(__vite_injected_original_dirname, "factory/index.ts"),
        types: resolve(__vite_injected_original_dirname, "types/index.ts")
      },
      fileName: "[name]",
      formats: ["cjs", "es"]
    },
    rollupOptions: {
      external: ["react"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGVpZnJpa3NoZWltL2FwcHMvZmx1eC9wYWNrYWdlcy91dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2xlaWZyaWtzaGVpbS9hcHBzL2ZsdXgvcGFja2FnZXMvdXRpbHMvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xlaWZyaWtzaGVpbS9hcHBzL2ZsdXgvcGFja2FnZXMvdXRpbHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogZmFsc2UsXG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbGliOiB7XG4gICAgICBlbnRyeToge1xuICAgICAgICBhcGk6IHJlc29sdmUoX19kaXJuYW1lLCBcImFwaS9pbmRleC50c1wiKSxcbiAgICAgICAgY29uc3RhbnRzOiByZXNvbHZlKF9fZGlybmFtZSwgXCJjb25zdGFudHMvaW5kZXgudHNcIiksXG4gICAgICAgIGhlbHBlcnM6IHJlc29sdmUoX19kaXJuYW1lLCBcImhlbHBlcnMvaW5kZXgudHNcIiksXG4gICAgICAgIGZhY3Rvcnk6IHJlc29sdmUoX19kaXJuYW1lLCBcImZhY3RvcnkvaW5kZXgudHNcIiksXG4gICAgICAgIHR5cGVzOiByZXNvbHZlKF9fZGlybmFtZSwgXCJ0eXBlcy9pbmRleC50c1wiKSxcbiAgICAgIH0sXG4gICAgICBmaWxlTmFtZTogXCJbbmFtZV1cIixcbiAgICAgIGZvcm1hdHM6IFtcImNqc1wiLCBcImVzXCJdLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFtcInJlYWN0XCJdLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1QsU0FBUyxvQkFBb0I7QUFDblYsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sV0FBVztBQUZsQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsT0FBTztBQUFBLElBQ0wsYUFBYTtBQUFBLElBQ2IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsS0FBSztBQUFBLE1BQ0gsT0FBTztBQUFBLFFBQ0wsS0FBSyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxRQUN0QyxXQUFXLFFBQVEsa0NBQVcsb0JBQW9CO0FBQUEsUUFDbEQsU0FBUyxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLFFBQzlDLFNBQVMsUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxRQUM5QyxPQUFPLFFBQVEsa0NBQVcsZ0JBQWdCO0FBQUEsTUFDNUM7QUFBQSxNQUNBLFVBQVU7QUFBQSxNQUNWLFNBQVMsQ0FBQyxPQUFPLElBQUk7QUFBQSxJQUN2QjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLE9BQU87QUFBQSxJQUNwQjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
