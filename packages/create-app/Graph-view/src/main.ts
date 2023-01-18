import "preact/debug";
import "@junto-foundation/junto-elements/dist/main.css";
import "@junto-foundation/junto-elements";
import register from "../utils/custom-element.js";
import App from "./App";

const CustomElement = register.toCustomElement(App, ["perspective", "source"], {
  shadow: false,
});

export default CustomElement;
