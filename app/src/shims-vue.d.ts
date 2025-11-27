/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue-advanced-cropper';

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const content: any;
  export default content;
}
