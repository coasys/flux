import { html, useState } from "htm/preact";

export default {
  name: "Carousel",
  description: "Carousel",
  tag: "j-carousel",
  component: ({ changeProp, ...props }) => {
    return html`
      <j-carousel
        onChange=${(e) => changeProp("value", e.target.value)}
        ...${props}
      >
        <j-box p="900" bg="ui-200">Slide 1</j-box>
        <j-box p="900" bg="ui-200">Slide 2</j-box>
        <j-box p="900" bg="ui-200">Slide 3</j-box>
      </j-carousel>
    `;
  },
};
