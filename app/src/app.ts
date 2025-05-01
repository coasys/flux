import { getAd4mClient } from "@coasys/ad4m-connect";
import { createPinia } from "pinia";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { createApp, h, watch } from "vue";
import { version } from "../package.json";
import "./ad4mConnect";
import App from "./App.vue";
import router from "./router";

import "@coasys/flux-ui";
import "@coasys/flux-ui/dist/main.css";
import "@coasys/flux-ui/dist/themes/black.css";
import "@coasys/flux-ui/dist/themes/cyberpunk.css";
import "@coasys/flux-ui/dist/themes/dark.css";
import "@coasys/flux-ui/dist/themes/retro.css";
import "./themes/themes.css";

export const pinia = createPinia();

pinia.use(async ({ store }) => {
  // Patch the store if persisted in localStorage
  const key = `${store.$id}-${version}`;
  const localState = localStorage.getItem(key);
  if (localState) {
    store.$patch(JSON.parse(localState));
    localStorage.setItem(key, JSON.stringify(store.$state));
  }

  // Watch for changes in the store and save to localStorage
  watch(store.$state, () => localStorage.setItem(`${store.$id}-${version}`, JSON.stringify(store.$state)));

  // Reset active community and channel IDs when the store is reset
  store.activeCommunityId = "";
  store.activeChannelId = "";

  // Add my AdamClient and Agent to the store for easy access throughout the app
  const ad4mClient = await getAd4mClient();
  store.setAdamClient(ad4mClient);
  store.setMe(await ad4mClient.agent.me());
});

// Create the Vue app
createApp({ render: () => h(App) })
  .use(pinia)
  .use(router)
  .mount("#app");

// Check for service worker updates every 10 minutes and reload
const intervalMS = 60 * 10 * 1000;
const updateServiceWorker = useRegisterSW({
  onRegistered(r: ServiceWorkerRegistration | undefined) {
    r && setInterval(() => r.update(), intervalMS);
  },
});
