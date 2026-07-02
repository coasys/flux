import { useAppStore, useRouteMemoryStore, useUiStore, useWebrtcStore } from '@/stores';
import { getAd4mConnect, isEmbedded } from '@coasys/ad4m-connect';
import { restoreNeighbourhoodPrefix } from '@/utils/routeUtils';
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
const routeMemoryStore = useRouteMemoryStore(pinia);

// Pending perspective navigation from WE, queued if received before initialization completes
let pendingPerspectiveNavigation: string | null = null;

function handlePerspectiveNavigation(communityId: string): void {
  const key = restoreNeighbourhoodPrefix(communityId);
  const privateKey = `private://${communityId}`;
  const community = appStore.myCommunities[key] ?? appStore.myCommunities[privateKey];

  if (community) {
    const lastRoute = routeMemoryStore.getLastCommunityRoute(communityId);
    router.push(lastRoute ? lastRoute.path : { name: 'community', params: { communityId } });
  } else {
    // Perspective exists but has no Flux community — offer to initialise one
    router.push({ name: 'init-community', params: { communityId } });
  }
}

// When embedded in WE: hide Flux sidebar and listen for perspective navigation messages
if (isEmbedded()) {
  const uiStore = useUiStore(pinia);
  uiStore.setAppSidebarOpen(false);

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type !== 'NAVIGATE_PERSPECTIVE') return;
    const communityId = event.data.communityId as string;
    if (!communityId) return;

    if (!appStore.initialized) {
      pendingPerspectiveNavigation = communityId;
    } else {
      handlePerspectiveNavigation(communityId);
    }
  });
}

// Tracks the route the user was on when credits ran out, so we can return them after topping up
let savedPreCreditRoute: typeof routeMemoryStore.currentRoute | null = null;

// Store the last saved route and current params before mounting the app
const savedRoute = { ...routeMemoryStore.currentRoute };
const currentParams = router.resolve(window.location.hash.slice(1) || '/').params;

// Mount the app immediately so UI is responsive
vueApp.mount('#app');

// Initialize Ad4m client in an async IIFE to support older browsers
(async () => {
  try {
    // Initialize Ad4m client
    const { client } = getAd4mConnect({
      appInfo: {
        name: 'Flux',
        description: 'A Social Toolkit for the New Internet',
        url: window.location.origin,
        iconPath: window.location.origin + '/icon.png',
      },
      capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }],
      hosting: true,
      allowedOrigins: (import.meta.env.VITE_ALLOWED_ORIGINS as string | undefined)
        ?.split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      onCreditsDepleted: () => {
        // Leave any active call first so the transcription widget is cleaned up
        const webrtcStore = useWebrtcStore(pinia);
        if (webrtcStore.inCall) webrtcStore.leaveRoom();

        // Save current route once per depletion session, then retreat to the splash/home screen.
        // The community views, signalling heartbeats, and AI task loops all stop naturally
        // because nothing is mounted at /home.
        if (!savedPreCreditRoute) {
          savedPreCreditRoute = { ...routeMemoryStore.currentRoute };
        }
        routeMemoryStore.setCurrentRoute({});
        router.push('/home');
      },
      onUseApp: () => {
        // User explicitly clicked "Use App" after topping up — navigate back to where they were.
        if (savedPreCreditRoute?.communityId) {
          const lastRoute = routeMemoryStore.getLastCommunityRoute(savedPreCreditRoute.communityId as string);
          router.push(lastRoute?.path || '/home');
        }
        savedPreCreditRoute = null;
      },
    });
    const ad4mClient = await client;

    if (!ad4mClient) throw new Error('Ad4mClient not available');

    // Initialize app store
    appStore.setAdamClient(ad4mClient);
    await appStore.refreshMyProfile();
    await appStore.getMyCommunities();
    appStore.initialized = true;

    // Fallback to signup if no Flux account found
    const hasFluxAccount = appStore.me.perspective?.links.some((e) => e.data.source.startsWith('flux://'));
    if (!hasFluxAccount) return;

    // If WE sent a NAVIGATE_PERSPECTIVE before init completed, handle it now and we're done.
    if (isEmbedded() && pendingPerspectiveNavigation) {
      handlePerspectiveNavigation(pendingPerspectiveNavigation);
      pendingPerspectiveNavigation = null;
      return;
    }

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
