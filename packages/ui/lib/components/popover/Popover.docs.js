import { html } from "htm/preact";

export default {
  name: "Popover",
  description: "",
  tag: "j-popover",
  component: ({ changeProp, ...props }) =>
    html`<j-popover ...${props}>
      <j-button slot="trigger" onClick=${() => changeProp("open", !props.open)}>
        Trigger
      </j-button>
      <j-menu slot="content">
        <j-menu-item>Menu item</j-menu-item>
        <j-menu-item>Menu item</j-menu-item>
      </j-menu>
    </j-popover>`,
};
