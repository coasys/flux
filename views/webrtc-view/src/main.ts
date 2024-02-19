import "preact/debug";

import "@coasys/flux-ui/dist/main.d.ts";
import { toCustomElement } from "@coasys/react-hooks";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
