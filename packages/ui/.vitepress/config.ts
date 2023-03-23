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
      {
        text: "Create Flux App",
        link: "/create-flux-app/getting-started/installation",
      },
    ],
    sidebar: {
      "/create-flux-app": [
        {
          text: "Create Flux App",
          items: [
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
              text: "Connecting to AD4M",
              link: "/create-flux-app/building-your-app/",
            },
            {
              text: "Getting data",
              link: "/create-flux-app/building-your-app/creating-data",
            },
            {
              text: "Building UI",
              link: "/create-flux-app/building-your-app/flux-ui",
            },
          ],
        },
        {
          text: "Working with data",
          items: [
            {
              text: "Creating models",
              link: "/create-flux-app/working-with-data/",
            },
            {
              text: "Writing to the network",
              link: "/create-flux-app/working-with-data/writing-to-the-network",
            },
            {
              text: "Real-time signals",
              link: "/create-flux-app/working-with-data/creating-data",
            },
            {
              text: "Validation",
              link: "/create-flux-app/working-with-data/flux-ui",
            },
          ],
        },
        {
          text: "Publishing",
          items: [
            {
              text: "Creating app-store assets",
              link: "/create-flux-app/publishing/creating-assets",
            },
            {
              text: "Publish on npm",
              link: "/create-flux-app/publishing/npm",
            },
          ],
        },
        {
          text: "Examples",
          items: [
            {
              text: "Tutorial: Whiteboard",
              link: "/create-flux-app/tutorial",
            },
            {
              text: "Tutorial: Minecraft clone",
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
