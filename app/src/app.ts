import { useAppStore } from '@/stores';
import { getAd4mConnect } from '@/ad4mConnect';
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

// Initialize ad4m-connect (handles both embedded and standalone modes)
const ad4mConnect = getAd4mConnect();

async function bootstrap() {
  try {
    console.log('Flux: Initializing Ad4m client');
    const ad4mClient = await getAd4mClientReady();
    appStore.setAdamClient(ad4mClient);
    await appStore.refreshMyProfile();
    console.log('Flux: Ad4m client initialized successfully');
    
    // Mount app AFTER client is ready
    vueApp.mount("#app");
  } catch (e) {
    console.error("Failed to initialize Ad4m client:", e);
  }
}

// Listen for authentication state changes
ad4mConnect.addEventListener('authstatechange', async () => {
  if (ad4mConnect.authState === 'authenticated') {
    await bootstrap();
  }
});

// Service worker (only in standalone mode - ad4m-connect won't interfere in embedded mode)
if (!appStore.isEmbedded) {
  const intervalMS = 60 * 10 * 1000;
  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      r && setInterval(() => r.update(), intervalMS);
    },
  });
}
