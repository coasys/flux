import "preact/debug";
import "@coasys/flux-ui/dist/main.d.ts";
import { toCustomElement } from "@coasys/flux-react-web";
import Editor from "@coasys/flux-editor";
import App from "./App";

if (!customElements.get("flux-editor")) {
  customElements.define("flux-editor", Editor);
}

const CustomElement: HTMLElement = toCustomElement(
  App,
  ["perspective", "agent", "source", "threaded"],
  {
    shadow: false,
  }
);

export default CustomElement;

