import { useAppStore } from '@/stores';
import { getAd4mClient } from '@coasys/ad4m-connect';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { createApp, h } from 'vue';
import { version } from '../package.json';
import { ad4mConnect } from './ad4mConnect';
import App from './App.vue';
import router from './router';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/vue';

import '@coasys/flux-ui';
import '@coasys/flux-ui/dist/main.css';
import '@coasys/flux-ui/dist/themes/black.css';
import '@coasys/flux-ui/dist/themes/cyberpunk.css';
import '@coasys/flux-ui/dist/themes/dark.css';
import '@coasys/flux-ui/dist/themes/retro.css';
import './themes/themes.css';
import { getAd4mClientReady } from '@coasys/flux-utils';

export const pinia = createPinia();

pinia.use(
  createPersistedState({
    key: (id) => `${id}-${version}`,
    storage: localStorage,
    serializer: {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    },
  }),
);

// Create and mount Vue application
const vueApp = createApp({ render: () => h(App) })
  .use(pinia)
  .use(router);

// Initialize Ad4mClient and mount after it's ready
const appStore = useAppStore(pinia);

async function bootstrap() {
  try {
    const ad4mClient = await getAd4mClientReady();
    appStore.setAdamClient(ad4mClient);
    appStore.refreshMyProfile();
  } catch (e) {
    console.error("Failed to initialize Ad4m client:", e);
  } finally {
    vueApp.mount("#app");
  }
}

// Wait for authentication before bootstrapping
if (ad4mConnect.authState === 'authenticated') {
  // Already authenticated (e.g., has stored token)
  bootstrap();
} else {
  // Wait for authentication
  vueApp.mount("#app"); // Mount the app immediately so UI is shown
  ad4mConnect.addEventListener('authstatechange', async () => {
    if (ad4mConnect.authState === 'authenticated') {
      try {
        const ad4mClient = await getAd4mClientReady();
        appStore.setAdamClient(ad4mClient);
        appStore.refreshMyProfile();
      } catch (e) {
        console.error("Failed to initialize Ad4m client after auth:", e);
      }
    }
  });
}

// Check for service worker updates every 10 minutes and reload
const intervalMS = 60 * 10 * 1000;
const updateServiceWorker = useRegisterSW({
  onRegistered(r: ServiceWorkerRegistration | undefined) {
    r && setInterval(() => r.update(), intervalMS);
  },
});
