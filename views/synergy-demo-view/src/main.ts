import "preact/debug";
import { toCustomElement } from "@coasys/flux-react-web";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source", "appStore"],
  { shadow: false }
);

export default CustomElement;
