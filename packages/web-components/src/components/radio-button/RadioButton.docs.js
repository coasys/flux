import { html } from "htm/preact";

export default {
  name: "Radio button",
  description: "",
  tag: "j-radio-button",
  component: ({ changeProp, ...props }) =>
    html`<j-radio-button
      onChange=${(e) => changeProp("checked", e.target.checked)}
      ...${props}
    >
      Radio button
    </j-radio-button>`,
};
