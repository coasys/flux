import { html } from "htm/preact";

export default {
  name: "Toast",
  description: "",
  tag: "j-toast",
  component: (props) => html`<j-toast ...${props}>Toast content</j-toast>`,
};
