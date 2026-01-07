import { useAppStore } from '@/stores';
import { buildAd4mClientFromConfig } from '@/utils/ad4mClient';
import { getAd4mConnect, ad4mConnect } from '@/ad4mConnect';
import { getAd4mClient } from '@coasys/ad4m-connect';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { createApp, h } from 'vue';
import { version } from '../package.json';
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

const appStore = useAppStore(pinia);

if (appStore.isEmbedded) {
  // EMBEDDED MODE: Running in WE launcher
  // Listen for AD4M config from parent window via postMessage
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'AD4M_CONFIG') {
      try {
        const { port, token } = event.data;

        // Build Ad4m client from config (no ad4m-connect needed)
        const ad4mClient = buildAd4mClientFromConfig(port, token);
        appStore.setAdamClient(ad4mClient);

        // Wait for profile to load before mounting
        await appStore.refreshMyProfile();

        // Mount the Vue app now that everything is ready
        vueApp.mount('#app');
      } catch (error) {
        console.error('Flux: Failed to initialize Ad4m client:', error);
      }
    }
  });

  // Request AD4M config from parent
  window.parent.postMessage({ type: 'REQUEST_AD4M_CONFIG' }, '*');
  
} else {
  // STANDALONE MODE: Running as webapp with ad4m-connect
  // Use multi-user authentication flow
  getAd4mConnect(); // Initialize the singleton

  async function bootstrap() {
    try {
      const ad4mClient = await getAd4mClientReady();
      appStore.setAdamClient(ad4mClient);
      appStore.refreshMyProfile();
    } catch (e) {
      console.error("Failed to initialize Ad4m client:", e);
    }
  }

  // Wait for authentication before bootstrapping
  if (ad4mConnect.authState === 'authenticated') {
    // Already authenticated (e.g., has stored token)
    await bootstrap();
    vueApp.mount("#app");
  } else {
    // Wait for authentication - mount app immediately so UI is shown
    vueApp.mount("#app");
    ad4mConnect.addEventListener('authstatechange', async () => {
      if (ad4mConnect.authState === 'authenticated') {
        await bootstrap();
      }
    });
  }

  // Service worker (only in standalone mode)
  const intervalMS = 60 * 10 * 1000;
  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      r && setInterval(() => r.update(), intervalMS);
    },
  });
}
