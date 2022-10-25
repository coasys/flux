import { html } from "htm/preact";

export default {
  name: "Tab Item",
  description: "",
  tag: "j-tab-item",
  component: (props) => html`<j-tab-item ...${props}>Tab item</j-tab-item>`,
};
