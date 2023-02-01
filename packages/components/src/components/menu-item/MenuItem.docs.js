import { html } from "htm/preact";

export default {
  name: "Menu item",
  description: "Menu-group",
  tag: "j-menu-item",
  component: (props) => html`<j-menu-item ...${props}>Menu item</j-menu-item> `,
};
