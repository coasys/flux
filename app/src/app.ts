import { useAppStore } from '@/stores';
import { getAd4mClient, isEmbedded } from '@coasys/ad4m-connect';
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

// Mount the app immediately so UI is responsive
vueApp.mount("#app");

// Initialize Ad4m client in an async IIFE to support older browsers
(async () => {
  try {
    // Initialize Ad4m client (handles both embedded and standalone modes automatically)
    const ad4mClient = await getAd4mClient({
      appInfo: {
        name: 'Flux',
        description: 'A Social Toolkit for the New Internet',
        url: window.location.origin,
        iconPath: window.location.origin + '/icon.png',
      },
      capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
      remoteUrl: 'https://lucksus.ad4m.dev:12001/graphql'
    });

    if (!ad4mClient) {
      throw new Error('Ad4mClient not available');
    }

    appStore.setAdamClient(ad4mClient);
    await appStore.refreshMyProfile();

    // Navigate to home if user is on landing/signup page
    const currentRoute = router.currentRoute.value;
    if (currentRoute.name === 'signup' || currentRoute.path === '/' || currentRoute.path === '') {
      router.push('/home');
    }
  } catch (error) {
    console.error('Failed to initialize Flux:', error);
  }
})();

// Service worker registration (only in standalone mode)
if (!isEmbedded()) {
  const intervalMS = 60 * 10 * 1000;
  useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      r && setInterval(() => r.update(), intervalMS);
    },
  });
}
