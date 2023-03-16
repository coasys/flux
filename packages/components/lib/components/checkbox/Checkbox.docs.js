import { html } from "htm/preact";

export default {
  name: "Checkbox",
  description: "Checkbox",
  tag: "j-checkbox",
  component: ({ changeProp, ...props }) =>
    html`<j-checkbox
      onChange=${(e) => changeProp("checked", e.target.checked)}
      ...${props}
      >Checkbox</j-checkbox
    >`,
};
