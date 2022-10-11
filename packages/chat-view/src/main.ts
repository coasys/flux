if (!window.ResizeObserver) window.ResizeObserver = ResizeObserver;

// dynamic import of emoji picker only if it's not defined already
if (customElements.get("emoji-picker") === undefined) {
  import("emoji-picker-element").then((widget) => {
    console.log("imported?");
  });
}

import register from "./custom-element.js";
import MyComponent from "./App";

const CustomElement = register.toCustomElement(
  MyComponent,
  ["perspective-uuid", "port", "channel"],
  { shadow: false }
);

export default CustomElement;
