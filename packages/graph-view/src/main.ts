import "preact/debug";

import register from "../utils/custom-element.js";
import App from "./App";

// dynamic import of emoji picker only if it's not defined already
if (customElements.get("emoji-picker") === undefined) {
  import("emoji-picker-element");
}

if (customElements.get("ad4m-connect") === undefined) {
  import("@perspect3vism/ad4m-connect");
}

const CustomElement = register.toCustomElement(App, ["perspective", "source"], {
  shadow: false,
});

export default CustomElement;
