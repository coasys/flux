import "preact/debug";

import register from "../utils/custom-element.js";
import App from "./App";

if (customElements.get("ad4m-connect") === undefined) {
  import("@perspect3vism/ad4m-connect");
}

const CustomElement = register.toCustomElement(App, ["perspective", "source"], {
  shadow: false,
});

export default CustomElement;
