import "preact/debug";
import "@fluxapp/ui/dist/main.d.ts";
import { toCustomElement } from "@fluxapp/react-web";
import App from "./App";
import CommentSection from "@fluxapp/comment-section";

if (!customElements.get("comment-section")) {
  customElements.define("comment-section", CommentSection);
}

const CustomElement = toCustomElement(App, ["perspective", "agent", "source"], {
  shadow: false,
});

export default CustomElement;
