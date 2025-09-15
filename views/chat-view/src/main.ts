import Editor from "@coasys/flux-editor";
import { toCustomElement } from "@coasys/flux-react-web";
import "@coasys/flux-ui/dist/main.d.ts";
import "preact/debug";
import App from "./App";

if (!customElements.get("flux-editor")) {
  customElements.define("flux-editor", Editor);
}

const CustomElement: HTMLElement = toCustomElement(App, ["perspective", "agent", "source", "threaded", "getProfile"], {
  shadow: false,
});

export default CustomElement;
