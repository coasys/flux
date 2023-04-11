import Theme from "vitepress/theme";
import "@fluxapp/ui/dist/main.css";
import "@fluxapp/ui/dist/themes/dark.css";
import "@fluxapp/ui/dist/themes/cyberpunk.css";
import "@fluxapp/ui/dist/themes/black.css";
import "@fluxapp/ui/dist/themes/retro.css";
import "./custom.css";

export default {
  ...Theme,
  async enhanceApp() {
    import("@fluxapp/ui");
  },
};
