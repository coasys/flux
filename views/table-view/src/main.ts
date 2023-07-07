import "preact/debug";
import { toCustomElement } from "@fluxapp/react-web";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
