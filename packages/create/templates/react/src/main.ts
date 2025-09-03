import "@coasys/flux-ui/dist/main.d.ts";
import Plugin from "./Plugin";
import r2wc from "@r2wc/react-to-web-component";

const CustomElement = r2wc(Plugin);

export default CustomElement;
