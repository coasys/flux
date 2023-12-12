import "preact/debug";

import "@coasys/flux-ui/dist/main.d.ts";
import { toCustomElement } from "@coasys/flux-react-web";
import Plugin from "./Plugin";

const CustomElement = toCustomElement(
  Plugin,
  ["perspective", "agent", "source"],
  {
    shadow: false,
  }
);

export default CustomElement;
