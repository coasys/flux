import { createApp, h, watch } from "vue";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { version } from "../package.json";
import "./ad4mConnect";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";

import "@fluxapp/junto-elements";
import "@fluxapp/junto-elements/dist/main.css";

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

// Check for service worker updates every 10 minutes and reload
const intervalMS = 60 * 10 * 1000;
const updateServiceWorker = useRegisterSW({
  onRegistered(r) {
    r &&
      setInterval(() => {
        r.update();
      }, intervalMS);
  },
});
