import { getAd4mConnect } from '@/ad4mConnect';
import { useAppStore, useRouteMemoryStore } from '@/stores';
import { RouteParams } from '@coasys/flux-types';
import { storeToRefs } from 'pinia';
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/signup',
    name: 'signup',
    component: () => import(`@/views/signup/SignUp.vue`),
  },
  {
    path: '/update-ad4m',
    name: 'update-ad4m',
    component: () => import(`@/views/update/UpdateAd4m.vue`),
  },
  {
    path: '/',
    name: 'main',
    component: () => import(`@/views/main/MainView.vue`),
    redirect: { name: 'home' },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import(`@/views/main/profile/ProfileView.vue`),
      },
      {
        path: 'communities/:communityId',
        props: true,
        name: 'community',
        component: () => import(`@/views/main/community/CommunityView.vue`),
        children: [
          {
            path: ':channelId',
            props: true,
            name: 'channel',
            component: () => import(`@/views/main/community/channel/ChannelView.vue`),
            children: [
              {
                path: ':viewId',
                props: true,
                name: 'view',
                component: () => import(`@/views/main/community/channel/view/ViewView.vue`),
              },
            ],
          },
        ],
      },
      {
        path: 'profile/:did',
        props: true,
        name: 'profile',
        component: () => import(`@/views/main/profile/ProfileView.vue`),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import(`@/containers/Settings.vue`),
      },
    ],
  },
];

const router = createRouter({ history: createWebHashHistory(), routes });

// Handle login routing
router.beforeEach(async (to, from, next) => {
  try {
    const appStore = useAppStore();
    const { me } = storeToRefs(appStore);

    // In embedded mode, skip all auth checks if client not initialized yet
    // (parent will send AD4M config via postMessage)
    if (appStore.isEmbedded && !appStore.isClientInitialized()) {
      next();
      return;
    }

    // Skip auth/signup flow if embedded - parent app handles authentication
    if (appStore.isEmbedded && to.name === 'signup') {
      next({ name: 'home' });
      return;
    }

    // Check authentication based on context (use store's isEmbedded flag)
    let isAuthenticated: boolean;
    if (appStore.isEmbedded) {
      // In iframe, check if client is initialized
      isAuthenticated = appStore.isClientInitialized();
    } else {
      // Standalone, use ad4mConnect
      const ad4mConnect = getAd4mConnect();
      
      // Wait for auto-connection to complete on page refresh (prevents signup screen flash)
      if (ad4mConnect && (ad4mConnect.connectionState === 'connecting' || ad4mConnect.connectionState === 'not_connected')) {
        const maxWait = 3000;
        const startTime = Date.now();
        while ((ad4mConnect.connectionState === 'connecting' || ad4mConnect.connectionState === 'not_connected') && 
               (Date.now() - startTime) < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      isAuthenticated = ad4mConnect ? await ad4mConnect.isAuthenticated() : false;
    }

    if (isAuthenticated) {
      // Handle authenticated routes
      const fluxAccountCreated = me.value.perspective?.links.find((e) => e.data.source.startsWith('flux://'));
      const isOnSignupOrMain = to.name === 'signup' || to.name === 'main';
      if (fluxAccountCreated && isOnSignupOrMain) {
        await appStore.refreshMyProfile();
        next('/home');
      } else if (!fluxAccountCreated && !isOnSignupOrMain) {
        next('/signup');
      } else {
        next();
      }
    } else {
      // If not logged in, redirect to signup
      if (to.name !== 'signup') {
        next('/signup');
      } else {
        next();
      }
    }
  } catch (e) {
    console.log('Error in route', e);
    if (to.name !== 'signup') {
      next('/signup');
    } else {
      next();
    }
  }
});

// Update the route memory store on each route change
router.afterEach((to) => {
  const routeMemoryStore = useRouteMemoryStore();
  const { communityId, channelId, viewId } = to.params as RouteParams;

  // Set the current route
  routeMemoryStore.setCurrentRoute({ communityId, channelId, viewId });

  // If navigating to a community, store the last full route for the community & the last view visited in the channel
  if (communityId) {
    routeMemoryStore.setLastCommunityRoute(communityId, to.path, to.params);
    if (channelId && viewId) routeMemoryStore.setLastChannelView(communityId, channelId, viewId);
  }
});

export default router;
