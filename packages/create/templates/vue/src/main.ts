import "@coasys/flux-ui/dist/main.d.ts";
import { defineCustomElement } from 'vue'
import Plugin from "./Plugin.vue";

const element = defineCustomElement(Plugin, { shadowRoot: false })

export default element
