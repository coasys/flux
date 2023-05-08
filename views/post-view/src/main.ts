import "preact/debug";

if (!window.ResizeObserver) window.ResizeObserver = ResizeObserver;

import register from "./custom-element.js";
import MyComponent from "./App.jsx";

const CustomElement = register.toCustomElement(
  MyComponent,
  ["perspective", "source"],
  { shadow: false }
);

export default CustomElement;
