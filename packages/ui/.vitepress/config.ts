import { defineConfig } from "vitepress";

export default defineConfig({
  // site-level options
  title: "Flux Dev Kit",
  description: "Just playing around.",
  srcDir: "./docs",
  appearance: false,
  themeConfig: {
    nav: [
      { text: "UI Library", link: "/ui-library" },
      { text: "Create Flux App", link: "/plugins" },
    ],
    sidebar: {
      "/ui-library": [
        {
          text: "Getting started",
          items: [
            {
              text: "Installation",
              link: "/ui-library/getting-started/installation",
            },
            {
              text: "Introduction",
              link: "/ui-library/getting-started/introduction",
            },
            { text: "Theming", link: "/ui-library/getting-started/theming" },
            {
              text: "Composition",
              link: "/ui-library/getting-started/composition",
            },
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
