import "preact/debug";

import { toCustomElement } from "@fluxapp/react-web";
import Editor from "@fluxapp/flux-editor";
import App from "./App";

if (!customElements.get("flux-editor")) {
  customElements.define("flux-editor", Editor);
}

const CustomElement = toCustomElement(
  App,
  ["perspective", "agent", "source", "threaded"],
  {
    shadow: false,
  }
);

export default CustomElement;
