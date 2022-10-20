import { html } from "htm/preact";

export default {
  name: "Menu Group",
  description: "Menu group",
  tag: "j-menu-group-item",
  component: ({ title = "Hello", ...props }) =>
    html`<j-menu-group-item ...${props} title=${title}>
      <j-menu-item>Menu item</j-menu-item>
      <j-menu-item>Menu item</j-menu-item>
      <j-menu-item>Menu item</j-menu-item>
    </j-menu-group-item>`,
};
