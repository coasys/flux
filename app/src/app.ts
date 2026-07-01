import { useAppStore, useRouteMemoryStore, useWebrtcStore } from '@/stores';
import { connectAsGuest, getAd4mConnect, isEmbedded } from '@coasys/ad4m-connect';
import { createPinia, storeToRefs } from 'pinia';
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
const routeMemoryStore = useRouteMemoryStore(pinia);

// Tracks the route the user was on when credits ran out, so we can return them after topping up
let savedPreCreditRoute: typeof routeMemoryStore.currentRoute | null = null;

// Store the last saved route and current params before mounting the app
const savedRoute = { ...routeMemoryStore.currentRoute };
const currentParams = router.resolve(window.location.hash.slice(1) || '/').params;

// Mount the app immediately so UI is responsive
vueApp.mount('#app');

// Read once at module load — survives any hash changes that follow
const urlParams = new URLSearchParams(window.location.search);
const demoHost  = urlParams.get('demoHost');

const appInfo = {
  name: 'Flux',
  description: 'A Social Toolkit for the New Internet',
  url: window.location.origin,
  iconPath: window.location.origin + '/icon.png',
};
const capabilities = [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }];

// Initialize Ad4m client in an async IIFE to support older browsers
(async () => {
  try {
    let ad4mClient;

    if (demoHost) {
      // Fast path: silently create/reuse a guest account on the remote host.
      // No ad4m-connect UI is shown — connectAsGuest handles credential generation
      // and login/signup automatically, then resolves with a ready Ad4mClient.
      ad4mClient = await connectAsGuest({ appInfo, capabilities }, demoHost);
    } else {
      // Standard path: show the ad4m-connect UI for local or remote connection.
      const { client } = getAd4mConnect({
        appInfo,
        capabilities,
        hosting: true,
        allowedOrigins: (import.meta.env.VITE_ALLOWED_ORIGINS as string | undefined)
          ?.split(',')
          .map((o) => o.trim())
          .filter(Boolean),
        onCreditsDepleted: () => {
          // Leave any active call first so the transcription widget is cleaned up
          const webrtcStore = useWebrtcStore(pinia);
          if (webrtcStore.inCall) webrtcStore.leaveRoom();

          // Save current route once per depletion session, then retreat to home.
          if (!savedPreCreditRoute) {
            savedPreCreditRoute = { ...routeMemoryStore.currentRoute };
          }
          routeMemoryStore.setCurrentRoute({});
          router.push('/home');
        },
        onUseApp: () => {
          if (savedPreCreditRoute?.communityId) {
            const lastRoute = routeMemoryStore.getLastCommunityRoute(savedPreCreditRoute.communityId as string);
            router.push(lastRoute?.path || '/home');
          }
          savedPreCreditRoute = null;
        },
      });
      ad4mClient = await client;
    }

    if (!ad4mClient) throw new Error('Ad4mClient not available');

    // Initialize app store
    appStore.setAdamClient(ad4mClient);
    await appStore.refreshMyProfile();
    await appStore.getMyCommunities();
    appStore.initialized = true;

    // Fallback to signup if no Flux account found
    const hasFluxAccount = appStore.me.perspective?.links.some((e) => e.data.source.startsWith('flux://'));
    if (!hasFluxAccount) return;

    // Determine which params to use for navigation (prioritize current params)
    let params = null;
    if (currentParams.communityId) params = currentParams;
    else if (savedRoute.communityId) params = savedRoute;

    // Navigate to params if available
    if (params) {
      if (params.viewId) await router.push({ name: 'view', params });
      else if (params.channelId) await router.push({ name: 'channel', params });
      else await router.push({ name: 'community', params });
      return;
    }

    // Navigate to home if Flux account exists but no saved route
    router.push('/home');
  } catch (error) {
    console.error('Failed to initialize Flux:', error);
  }
})();

// Service worker registration - only register when running in standalone mode
if (!isEmbedded()) {
  const intervalMS = 60 * 10 * 1000;
  useRegisterSW({
    immediate: true,
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      if (r) {
        setInterval(() => r.update(), intervalMS);
      }
    },
  });
}
