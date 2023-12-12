import Theme from "vitepress/theme";
import "@coasys/flux-ui/dist/main.css";
import "@coasys/flux-ui/dist/themes/dark.css";
import "@coasys/flux-ui/dist/themes/cyberpunk.css";
import "@coasys/flux-ui/dist/themes/black.css";
import "@coasys/flux-ui/dist/themes/retro.css";
import "./custom.css";

export default {
  extends: Theme,
  async enhanceApp({ app }) {
    if (!import.meta.env.SSR) {
      import("@coasys/flux-ui/dist/main").then((module) => {});
    }
  },
};
