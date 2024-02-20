import "preact/debug";
import { toCustomElement } from "@coasys/ad4m-react-hooks";
import MyComponent from "./App";
import Editor from "@coasys/flux-editor";
import "@coasys/flux-ui/dist/main.d.ts";

if (!customElements.get("flux-editor")) {
  customElements.define("flux-editor", Editor);
}

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
