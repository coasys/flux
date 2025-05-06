import "preact/debug";

import { toCustomElement } from "@coasys/flux-react-web";
import "@coasys/flux-ui/dist/main.d.ts";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source", "currentView", "setModalOpen", "appStore"],
  { shadow: false }
);

export default CustomElement;
