export {};

declare global {
  namespace preact {
    interface Component {
      // This is a workaround for https://github.com/preactjs/preact/issues/1206
      refs: Record<string, any>;
    }
  }
}
