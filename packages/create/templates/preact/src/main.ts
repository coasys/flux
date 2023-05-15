import "preact/debug";

import { toCustomElement } from "@fluxapp/react-web";
import App from "./App";

const CustomElement = toCustomElement(App, ["perspective", "agent", "source"], {
  shadow: false,
});

export default CustomElement;
