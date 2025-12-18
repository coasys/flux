import { useAppStore } from '@/stores';
import { buildAd4mClientFromConfig } from '@/utils/ad4mClient';
import { getAd4mConnect } from '@/ad4mConnect';
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
  // Running in launcher - listen for AD4M config from parent window
  window.addEventListener('message', async (event) => {
    // Validate message type
    if (event.data.type === 'AD4M_CONFIG') {
      try {
        const { port, token } = event.data;

        // Build Ad4m client from config
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
  // Running as standalone webapp - use ad4m-connect
  getAd4mConnect();

  // Build the Ad4m client from ad4m-connect once authenticated
  (async () => {
    try {
      const ad4mClient = await getAd4mClient();
      appStore.setAdamClient(ad4mClient);

      // Wait for profile to load before mounting
      await appStore.refreshMyProfile();

      // Mount the Vue app now that everything is ready
      vueApp.mount('#app');
    } catch (error) {
      console.error('Failed to initialize Ad4m client:', error);
    }
  })();

  // Check for service worker updates every 10 minutes and reload
  const intervalMS = 60 * 10 * 1000;
  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      r && setInterval(() => r.update(), intervalMS);
    },
  });
}
