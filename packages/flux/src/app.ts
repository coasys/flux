import { createApp, h, watch } from "vue";
import App from "./App.vue";
import router from "./router";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./serviceworker.js");
}

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";

import { createPinia } from "pinia";

const pinia = createPinia();

pinia.use(({ store }) => {
  const key = store.$id;
  const localState = localStorage.getItem(key);

  if (localState) {
    store.$patch(JSON.parse(localState));
    localStorage.setItem(key, JSON.stringify(store.$state));
  }

  watch(store.$state, () => {
    localStorage.setItem(key, JSON.stringify(store.$state));
  });
});

createApp({
  render: () => h(App),
})
  .use(pinia)
  .use(router)
  .mount("#app");
