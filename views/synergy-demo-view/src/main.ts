import "preact/debug";
import { toCustomElement } from "@coasys/ad4m-react-hooks";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source", "appStore"],
  { shadow: false }
);

export default CustomElement;
