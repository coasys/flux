import { defineConfig } from "vitepress";

export default defineConfig({
  // site-level options
  title: "Flux Components",
  description: "Just playing around.",
  srcDir: "./docs",
  themeConfig: {
    nav: [
      { text: "UI Kit", link: "/components" },
      { text: "Plugin API", link: "/plugins" },
    ],
    sidebar: {
      "/components": [
        {
          text: "Gettings started",
          items: [
            { text: "Installation", link: "/components/installation" },
            {
              text: "Design principles",
              link: "/components/design-principles",
            },
          ],
        },
        {
          text: "Tokens",
          items: [
            { text: "Typography", link: "/components/avatar" },
            { text: "Spacing", link: "/components/button" },
            { text: "Colors", link: "/components/button" },
            { text: "Depth", link: "/components/button" },
          ],
        },
        {
          text: "Components",
          items: [
            { text: "Avatar", link: "/components/avatar" },
            { text: "Badge", link: "/components/badge" },
            { text: "Button", link: "/components/button" },
            { text: "Checkbox", link: "/components/checkbox" },
            { text: "Input", link: "/components/input" },
            { text: "Menu", link: "/components/menu" },
            { text: "Modal", link: "/components/modal" },
          ],
        },
      ],
    },
    // theme-level options
  },
});
