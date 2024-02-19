import "preact/debug";

import { toCustomElement } from "@coasys/react-hooks";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
