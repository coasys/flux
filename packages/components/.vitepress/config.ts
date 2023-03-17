import { defineConfig } from "vitepress";

export default defineConfig({
  // site-level options
  title: "Flux Components",
  description: "Just playing around.",
  srcDir: "./docs",
  themeConfig: {
    nav: [
      { text: "UI Library", link: "/ui-library" },
      { text: "Plugin API", link: "/plugins" },
    ],
    sidebar: {
      "/ui-library": [
        {
          text: "Gettings started",
          items: [
            { text: "Installation", link: "/ui-library/installation" },
            {
              text: "Design principles",
              link: "/ui-library/design-principles",
            },
          ],
        },
        {
          text: "Tokens",
          items: [
            { text: "Typography", link: "/ui-library/avatar" },
            { text: "Spacing", link: "/ui-library/button" },
            { text: "Colors", link: "/ui-library/button" },
            { text: "Depth", link: "/ui-library/button" },
          ],
        },
        {
          text: "Components",
          items: [
            { text: "Avatar", link: "/ui-library/avatar" },
            { text: "Badge", link: "/ui-library/badge" },
            { text: "Button", link: "/ui-library/button" },
            { text: "Checkbox", link: "/ui-library/checkbox" },
            { text: "Input", link: "/ui-library/input" },
            { text: "Menu", link: "/ui-library/menu" },
            { text: "Menu Group", link: "/ui-library/menu-group" },
            { text: "Modal", link: "/ui-library/modal" },
            { text: "Tooltip", link: "/ui-library/tooltip" },
          ],
        },
      ],
    },
    // theme-level options
  },
});
