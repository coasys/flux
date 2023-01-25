import { html } from "htm/preact";

export default {
  name: "Select",
  description: "",
  tag: "j-select",
  component: (props) => html`<j-select ...${props}>
    <j-menu>
      <j-menu-item value="1">Menu item</j-menu-item>
      <j-menu-item value="2">Menu item 2</j-menu-item>
      <j-menu-item value="3">Menu item 3</j-menu-item>
    </j-menu>
  </j-select>`,
};
