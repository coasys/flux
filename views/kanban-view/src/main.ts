import "preact/debug";

import "@fluxapp/ui/dist/main.d.ts";
import { toCustomElement } from "@fluxapp/react-web";
import App from "./App";

const CustomElement = toCustomElement(App, ["perspective", "agent", "source"], {
  shadow: false,
});

export default CustomElement;
