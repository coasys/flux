import { defineConfig } from "vitepress";

export default defineConfig({
  // site-level options
  title: "Flux Dev Kit",
  description: "Just playing around.",
  srcDir: "./docs",
  appearance: "dark",
  themeConfig: {
    nav: [
      {
        text: "UI Library",
        link: "/ui-library/getting-started/installation",
      },
      { text: "Create Flux App", link: "/create-flux-app" },
    ],
    sidebar: {
      "/create-flux-app": [
        {
          text: "Getting started",
          items: [
            { text: "Introduction", link: "/create-flux-app/getting-started/" },
            {
              text: "Installation",
              link: "/create-flux-app/getting-started/installation",
            },
          ],
        },
        {
          text: "Building your app",
          items: [
            {
              text: "Your first perspective",
              link: "/create-flux-app/building-your-app/",
            },
            {
              text: "Displaying data from AD4M",
              link: "/create-flux-app/building-your-app/",
            },
            {
              text: "Using Flux-UI",
              link: "/create-flux-app/building-your-app/",
            },
            {
              text: "Custom components",
              link: "/create-flux-app/building-your-app/",
            },
          ],
        },
        {
          text: "Publishing",
          items: [
            {
              text: "Publish on npm",
              link: "/create-flux-app/publishing/",
            },
          ],
        },
        {
          text: "Examples",
          items: [
            {
              text: "Tutorial: Tic Tac Toe",
              link: "/create-flux-app/tutorial",
            },
          ],
        },
      ],
      "/ui-library": [
        {
          text: "Getting started",
          items: [
            {
              text: "Installation",
              link: "/ui-library/getting-started/installation",
            },

            { text: "Theming", link: "/ui-library/getting-started/theming" },
            {
              text: "Composition",
              link: "/ui-library/getting-started/composition",
            },
            {
              text: "Variables",
              link: "/ui-library/getting-started/variables",
            },
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
            { text: "Text", link: "/ui-library/components/text" },
            { text: "Popover", link: "/ui-library/components/popover" },
            { text: "Radio", link: "/ui-library/components/radio" },
            { text: "Tooltip", link: "/ui-library/components/tooltip" },
            { text: "Toggle", link: "/ui-library/components/toggle" },
            { text: "Spinner", link: "/ui-library/components/spinner" },
          ],
        },
      ],
    },
    // theme-level options
  },
});
