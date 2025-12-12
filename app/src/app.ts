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

// Use the isEmbedded flag from the store (single source of truth)
const isEmbedded = appStore.isEmbedded;
console.log('=== FLUX INIT DEBUG ===');
console.log('window.self:', window.self);
console.log('window.top:', window.top);
console.log('isEmbedded:', isEmbedded);
console.log('======================');

// Add visual debug banner
const debugBanner = document.createElement('div');
debugBanner.style.cssText =
  'position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 10px; z-index: 9999; font-weight: bold; text-align: center;';
debugBanner.textContent = `DEBUG: isEmbedded=${isEmbedded}, self=${window.self === window.top ? 'same as top' : 'different from top'}`;
document.body.appendChild(debugBanner);
setTimeout(() => debugBanner.remove(), 30000); // Remove after 30 seconds

if (isEmbedded) {
  // Running in launcher - use postMessage to get AD4M client
  console.log('Flux: Running in iframe, waiting for AD4M config from parent');

  // Listen for AD4M config from parent window (WE launcher)
  window.addEventListener('message', (event) => {
    // Validate message type
    if (event.data.type === 'AD4M_CONFIG') {
      console.log('Flux: Received AD4M config from parent');

      try {
        const { port, token } = event.data;

        // Build Ad4m client from config
        const ad4mClient = buildAd4mClientFromConfig(port, token);
        appStore.setAdamClient(ad4mClient);
        appStore.refreshMyProfile();

        console.log('Flux: Ad4m client initialized successfully');
        
        // Mount the Vue app now that client is ready
        vueApp.mount('#app');
        console.log('Flux: Vue app mounted');
      } catch (error) {
        console.error('Flux: Failed to initialize Ad4m client:', error);
      }
    }
  });
  
  console.log('Flux: Listener set up, waiting for AD4M_CONFIG from parent');
} else {
  // Running as standalone webapp - use ad4m-connect
  console.log('Flux: Running as standalone, using ad4m-connect');

  getAd4mConnect();

  // Build the Ad4m client from ad4m-connect once authenticated
  (async () => {
    try {
      const ad4mClient = await getAd4mClient();
      appStore.setAdamClient(ad4mClient);
      appStore.refreshMyProfile();
      console.log('Flux: Ad4m client initialized via ad4m-connect');
      
      // Mount the Vue app now that client is ready
      vueApp.mount('#app');
      console.log('Flux: Vue app mounted');
    } catch (error) {
      console.error('Failed to initialize Ad4m client:', error);
    }
  })();
}

// Only register service worker when NOT running in iframe (standalone mode)
if (!isEmbedded) {
  console.log('Flux: Registering service worker for standalone mode');
  // Check for service worker updates every 10 minutes and reload
  const intervalMS = 60 * 10 * 1000;
  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      r && setInterval(() => r.update(), intervalMS);
    },
  });
} else {
  console.log('Flux: Skipping service worker registration (iframe mode)');
}
