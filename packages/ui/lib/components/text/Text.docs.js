import { html } from "htm/preact";

export default {
  name: "Text",
  description: "",
  tag: "j-text",
  component: (props) =>
    html`<j-text ...${props}>
      The quick brown fox jumps over the lazy dog
    </j-text>`,
};
