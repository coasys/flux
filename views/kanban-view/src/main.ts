import "preact/debug";
import "@coasys/flux-ui/dist/main.d.ts";
import { toCustomElement } from "@coasys/react-hooks";
import App from "./App";
import CommentSection from "@coasys/flux-comment-section";

if (!customElements.get("comment-section")) {
  customElements.define("comment-section", CommentSection);
}

const CustomElement = toCustomElement(App, ["perspective", "agent", "source"], {
  shadow: false,
});

export default CustomElement;
