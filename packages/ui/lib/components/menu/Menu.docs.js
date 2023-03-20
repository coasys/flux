import { html } from "htm/preact";

export default {
  name: "Menu",
  description: "Menu",
  tag: "j-menu",
  component: (props) =>
    html`<j-menu ...${props}>
      <j-menu-item>Menu item</j-menu-item>
      <j-menu-item>Menu item</j-menu-item>
    </j-menu>`,
};
