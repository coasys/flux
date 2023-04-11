import Theme from "vitepress/theme";
import "@fluxapp/ui/dist/main.css";
import "@fluxapp/ui/dist/themes/dark.css";
import "@fluxapp/ui/dist/themes/cyberpunk.css";
import "@fluxapp/ui/dist/themes/black.css";
import "@fluxapp/ui/dist/themes/retro.css";
import "./custom.css";

export default {
  extends: Theme,
  async enhanceApp({ app }) {
    if (!import.meta.env.SSR) {
      import("@fluxapp/ui").then((module) => {
        // use code
        // app.use(module);
      });
    }
  },
};
