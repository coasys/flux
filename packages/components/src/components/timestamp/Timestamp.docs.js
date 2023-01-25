import { html } from "htm/preact";

export default {
  name: "Timestamp",
  description: "",
  tag: "j-timestamp",
  component: ({ value = "2/1/22", ...props }) => {
    return html`<j-timestamp ...${props} value=${value}></j-timestamp>`;
  },
};
