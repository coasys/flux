import { html } from "htm/preact";

export default {
  name: "Icon",
  description: "Icon",
  tag: "j-icon",
  component: ({ name = "sun", ...props }) => {
    return html`<j-icon name=${name} ...${props}></j-icon>`;
  },
};
