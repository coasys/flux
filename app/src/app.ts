import { createApp, h, watch } from "vue";
import { version } from "../package.json";
import "./ad4mConnect";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";

export const pinia = createPinia();

pinia.use(({ store }) => {
  const key = `${store.$id}-${version}`;
  const localState = localStorage.getItem(key);

  if (localState) {
    store.$patch(JSON.parse(localState));
    localStorage.setItem(key, JSON.stringify(store.$state));
  }

  watch(store.$state, () => {
    localStorage.setItem(
      `${store.$id}-${version}`,
      JSON.stringify(store.$state)
    );
  });
});

createApp({
  render: () => h(App),
})
  .use(pinia)
  .use(router)
  .mount("#app");
