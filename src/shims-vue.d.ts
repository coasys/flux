/* eslint-disable */

export {}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    api: any;
  }
}

declare module "vue3-virtual-scroller";

declare module "vue-advanced-cropper";

declare module "object-hash";

declare module "easygraphql-tester";