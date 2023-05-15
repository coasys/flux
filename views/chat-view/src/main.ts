import "preact/debug";

if (!window.ResizeObserver) window.ResizeObserver = ResizeObserver;

import { toCustomElement } from "@fluxapp/react-web";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
