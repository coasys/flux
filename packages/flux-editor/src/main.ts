import "preact/debug";

import register from "../utils/custom-element.js";
import App from "./App";

const CustomElement = register.toCustomElement(
  App,
  ["perspective", "agent", "source"],
  {
    shadow: false,
  }
);

export default CustomElement;
