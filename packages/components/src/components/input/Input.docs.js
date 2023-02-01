import { html } from "htm/preact";

export default {
  name: "Input",
  description: "Input",
  tag: "j-input",
  component: ({ changeProp, ...props }) =>
    html`<j-input
      onInput=${(e) => changeProp("value", e.target.value)}
      onChange=${(e) => changeProp("value", e.target.value)}
      ...${props}
    /> `,
};
