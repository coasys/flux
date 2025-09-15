import CommentSection from "@coasys/flux-comment-section";
import { toCustomElement } from "@coasys/flux-react-web";
import "@coasys/flux-ui/dist/main.d.ts";
import "preact/debug";
import App from "./App";

if (!customElements.get("comment-section")) customElements.define("comment-section", CommentSection);

const CustomElement = toCustomElement(App, ["perspective", "agent", "source", "getProfile"], { shadow: false });

export default CustomElement;
