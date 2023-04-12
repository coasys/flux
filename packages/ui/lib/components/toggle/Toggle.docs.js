import { html } from "htm/preact";

export default {
  name: "Toggle",
  description: "Toggle",
  tag: "j-toggle",
  component: ({ changeProp, ...props }) =>
    html`<j-toggle
      onChange=${(e) => changeProp("checked", e.target.checked)}
      ...${props}
    >
      Toggle
    </j-toggle>`,
};
