import { html } from "htm/preact";

export default {
  name: "Flex",
  description: "Flex",
  tag: "j-flex",
  component: (props) => html`<j-flex ...${props}>
    <div>Flex 1</div>
    <div>Flex 2</div>
    <div>Flex 3</div>
  </j-flex>`,
};
