import { html } from "htm/preact";

export default {
  name: "Button",
  description: "Button",
  tag: "j-button",
  component: (props) => {
    return html`<j-button ...${props}>Button</j-button>`;
  },
};
