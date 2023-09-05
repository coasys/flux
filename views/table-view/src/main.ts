import "preact/debug";
import { toCustomElement } from "@fluxapp/react-web";
import MyComponent from "./App";
import CommentSection from "@fluxapp/comment-section";

if (!customElements.get("comment-section")) {
  customElements.define("comment-section", CommentSection);
}

const CustomElement = toCustomElement(
  MyComponent,
  ["perspective", "agent", "source"],
  { shadow: false }
);

export default CustomElement;
