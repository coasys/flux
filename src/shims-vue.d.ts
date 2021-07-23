/* eslint-disable */

import Vue from "vue";
import VueRouter from "vue-router";
import { Route } from "vue-router";

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "vue/types/vue" {
  interface Vue {
    $router: VueRouter;
    $route: Route;
  }
}

declare module "vue3-virtual-scroller";

declare module "vue-advanced-cropper";

declare module "object-hash";

declare module "easygraphql-tester";
