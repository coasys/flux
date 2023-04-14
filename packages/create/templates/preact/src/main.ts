import "preact/debug";
import "@fluxapp/ui/dist/main.d.ts";

import register from "../utils/custom-element.js";
import App from "./App";

const CustomElement = register.toCustomElement(App, ["perspective", "source"], {
  shadow: false,
});

export default CustomElement;
