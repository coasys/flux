import vue from "@vitejs/plugin-vue";
import path from "path";

export default {
  plugins: [vue()],
  define: {
    "process.env": {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
