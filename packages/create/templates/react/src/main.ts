import "@coasys/flux-ui/dist/main.d.ts";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Plugin from "./Plugin";
import { reactToWebComponent } from "@coasys/ad4m-react-hooks";

const CustomElement = reactToWebComponent(Plugin, React, ReactDOM, {
  observedProps: ["perspective", "agent", "source"],
});

export default CustomElement;
