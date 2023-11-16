import "preact/debug";

import "@fluxapp/ui/dist/main.d.ts";
import { toCustomElement } from "@fluxapp/react-web";
import Plugin from "./Plugin";

const CustomElement = toCustomElement(
  Plugin,
  ["perspective", "agent", "source"],
  {
    shadow: false,
  }
);

export default CustomElement;
