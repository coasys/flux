import { html } from "htm/preact";

export default {
  name: "Tooltip",
  description: "",
  tag: "j-tooltip",
  component: ({ changeProp, title = "Hello", ...props }) =>
    html`<j-tooltip
      ...${props}
      onToggle=${(e) => changeProp("open", e.target.open)}
      title=${title}
    >
      <j-button>Hover over me</j-button>
    </j-tooltip>`,
};
