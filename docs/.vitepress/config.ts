import { defineConfig } from "vitepress";

export default defineConfig({
  // site-level options
  title: "Flux Developer",
  description: "Just playing around.",
  srcDir: "./src",
  outDir: "./dist",
  appearance: "dark",
  head: [["link", { rel: "shortcut icon", href: "/assets/favicon.ico" }]],
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith("j-"),
      },
    },
  },
  themeConfig: {
    nav: [
      {
        text: "UI Components",
        link: "/ui-library/getting-started/introduction",
      },
      {
        text: "Playground",
        link: "/playground",
      },
      {
        text: "Create an App",
        link: "/create-flux-app/getting-started/introduction",
      },
    ],
    sidebar: {
      "/create-flux-app": [
        {
          text: "Getting Started",
          items: [
            {
              text: "Introduction",
              link: "/create-flux-app/getting-started/introduction",
            },
            {
              text: "Quick Start",
              link: "/create-flux-app/getting-started/installation",
            },
          ],
        },
        {
          text: "Bascis",
          items: [
            {
              text: "Connecting to AD4M",
              link: "/create-flux-app/basics/connecting-to-ad4m",
            },
            {
              text: "Models",
              link: "/create-flux-app/basics/models",
            },
            {
              text: "Data",
              link: "/create-flux-app/basics/data",
            },
          ],
        },
        {
          text: "Guides",
          items: [
            {
              text: "Real-time Signals",
              link: "/create-flux-app/guides/real-time-signals",
            },
            {
              text: "Validation",
              link: "/create-flux-app/guides/validation",
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
              link: "/create-flux-app/publishing/publish-on-npm",
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
              text: "Tutorial: Minecraft Clone",
              link: "/create-flux-app/tutorial",
            },
          ],
        },
      ],
      "/ui-library": [
        {
          text: "Getting Started",
          items: [
            {
              text: "Introduction",
              link: "/ui-library/getting-started/introduction",
            },
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
            { text: "Box", link: "/ui-library/components/box" },
            { text: "Checkbox", link: "/ui-library/components/checkbox" },
            {
              text: "Emoji Picker",
              link: "/ui-library/components/emoji-picker",
            },
            { text: "Flex", link: "/ui-library/components/flex" },
            { text: "Input", link: "/ui-library/components/input" },
            { text: "Menu", link: "/ui-library/components/menu" },
            { text: "Menu Group", link: "/ui-library/components/menu-group" },
            { text: "Modal", link: "/ui-library/components/modal" },
            { text: "Tabs", link: "/ui-library/components/tabs" },
            { text: "Text", link: "/ui-library/components/text" },
            { text: "Timestamp", link: "/ui-library/components/timestamp" },
            { text: "Toast", link: "/ui-library/components/toast" },
            { text: "Popover", link: "/ui-library/components/popover" },
            { text: "Radio", link: "/ui-library/components/radio" },
            { text: "Skeleton", link: "/ui-library/components/skeleton" },
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
