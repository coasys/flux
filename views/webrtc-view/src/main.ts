import "preact/debug";

import { toCustomElement } from "@coasys/ad4m-react-hooks";
import "@coasys/flux-ui/dist/main.d.ts";
import MyComponent from "./App";

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source", "currentView", "setModalOpen", "appStore"],
  { shadow: false }
);

export default CustomElement;
