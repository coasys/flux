import { useAppStore } from "@/stores";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { createApp, h } from "vue";
import { version } from "../package.json";
import "./ad4mConnect";
import App from "./App.vue";
import router from "./router";
// @ts-ignore
import { useRegisterSW } from "virtual:pwa-register/vue";

import "@coasys/flux-ui";
import "@coasys/flux-ui/dist/main.css";
import "@coasys/flux-ui/dist/themes/black.css";
import "@coasys/flux-ui/dist/themes/cyberpunk.css";
import "@coasys/flux-ui/dist/themes/dark.css";
import "@coasys/flux-ui/dist/themes/retro.css";
import "./themes/themes.css";

export const pinia = createPinia();

pinia.use(
  createPersistedState({
    key: (id) => `${id}-${version}`,
    storage: localStorage,
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  })
);

// Create and mount Vue application
const vueApp = createApp({ render: () => h(App) })
  .use(pinia)
  .use(router);

// Initialize Ad4mClient
const appStore = useAppStore(pinia);
(async () => {
  try {
    const ad4mClient = await getAd4mClient();
    appStore.setAdamClient(ad4mClient);
    appStore.refreshMyProfile();
  } catch (error) {
    console.error("Failed to initialize Ad4m client:", error);
  }
})();

// Mount the app
vueApp.mount("#app");

// Check for service worker updates every 10 minutes and reload
const intervalMS = 60 * 10 * 1000;
const updateServiceWorker = useRegisterSW({
  onRegistered(r: ServiceWorkerRegistration | undefined) {
    r && setInterval(() => r.update(), intervalMS);
  },
});
