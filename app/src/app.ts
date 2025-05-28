import { useAppStore, useUiStore, useWebrtcStore } from "@/stores";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { createPinia, storeToRefs } from "pinia";
import { createApp, h, watch } from "vue";
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

pinia.use(({ store }) => {
  // Common plugin functionality for all stores
  const key = `${store.$id}-${version}`;
  const localState = localStorage.getItem(key);
  if (localState) {
    store.$patch(JSON.parse(localState));
    localStorage.setItem(key, JSON.stringify(store.$state));
  }

  // Watch for changes in the store and save to localStorage
  watch(
    store.$state,
    (state) => {
      try {
        localStorage.setItem(`${store.$id}-${version}`, JSON.stringify(state));
      } catch (error) {
        console.error(`Error persisting state for ${store.$id}:`, error);
      }
    },
    { deep: true }
  );
});

// Create and mount Vue application
const vueApp = createApp({ render: () => h(App) })
  .use(pinia)
  .use(router);

// TODO: set up persistence settings in stores and remove these resets

// Reset call state if persisted from the last session
const webrtcStore = useWebrtcStore(pinia);
const { callRoute, inCall } = storeToRefs(webrtcStore);
callRoute.value = {};
inCall.value = false;

// Reset call window state for now
const uiStore = useUiStore(pinia);
const { callWindowWidth, callWindowOpen } = storeToRefs(uiStore);
callWindowOpen.value = false;
callWindowWidth.value = "50%";

// Initialize Ad4mClient
const appStore = useAppStore(pinia);
(async () => {
  try {
    const ad4mClient = await getAd4mClient();
    appStore.setAdamClient(ad4mClient);
    appStore.setMe(await ad4mClient.agent.me());
    appStore.setAIEnabled(!!(await ad4mClient.ai.getDefaultModel("LLM")));
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
