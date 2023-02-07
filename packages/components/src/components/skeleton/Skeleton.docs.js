import { html } from "htm/preact";

export default {
  name: "Skeleton",
  description: "Placeholder for loading states",
  tag: "j-skeleton",
  component: ({ ...props }) => html`<j-skeleton ...${props}> </j-skeleton>`,
};
