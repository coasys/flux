/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "data:text/javascript;*" {
  export const number: number;
  export function fn(): string;
}

declare module "v-tooltip";

declare module "vue3-virtual-scroller";

declare module "vue-advanced-cropper";

declare module "object-hash";
