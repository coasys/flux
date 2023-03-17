import { defineConfig } from "vitepress";

export default defineConfig({
  // site-level options
  title: "Flux Components",
  description: "Just playing around.",
  srcDir: "./docs",
  appearance: "dark",
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
            {
              text: "Installation",
              link: "/ui-library/getting-started/installation",
            },
            {
              text: "Design principles",
              link: "/ui-library/getting-started/design-principles",
            },
          ],
        },
        {
          text: "Theming",
          items: [
            { text: "Basics", link: "/ui-library/theming/basics" },
            { text: "Variables", link: "/ui-library/theming/variables" },
          ],
        },
        {
          text: "Components",
          items: [
            { text: "Avatar", link: "/ui-library/components/avatar" },
            { text: "Badge", link: "/ui-library/components/badge" },
            { text: "Button", link: "/ui-library/components/button" },
            { text: "Checkbox", link: "/ui-library/components/checkbox" },
            { text: "Input", link: "/ui-library/components/input" },
            { text: "Menu", link: "/ui-library/components/menu" },
            { text: "Menu Group", link: "/ui-library/components/menu-group" },
            { text: "Modal", link: "/ui-library/components/modal" },
            { text: "Tabs", link: "/ui-library/components/tabs" },
            { text: "Tooltip", link: "/ui-library/components/tooltip" },
          ],
        },
      ],
    },
    // theme-level options
  },
});
