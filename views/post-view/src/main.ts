import "preact/debug";

if (!window.ResizeObserver) window.ResizeObserver = ResizeObserver;

import { toCustomElement } from "@coasys/react-hooks";
import MyComponent from "./App";
import FluxEditor from "@coasys/flux-editor";
import CommentSection from "@coasys/flux-comment-section";

if (!customElements.get("comment-section")) {
  customElements.define("comment-section", CommentSection);
}

if (!customElements.get("flux-editor")) {
  customElements.define("flux-editor", FluxEditor);
}

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
