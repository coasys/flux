import { useAppStore, useModalStore, useRouteMemoryStore, useUiStore } from '@/stores';
import { restoreNeighbourhoodPrefix } from '@/utils/routeUtils';
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
    meta: { public: true },
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
      {
        path: '/join-community/:communityId',
        name: 'join-community',
        component: () => import('@/views/JoinCommunityView.vue'),
      },
    ],
  },
];

const router = createRouter({ history: createWebHashHistory(), routes });

// Handle authentication and route guarding
router.beforeEach(async (to, from, next) => {
  try {
    const appStore = useAppStore();

    // Allow signup to display while initializing
    if (!appStore.initialized && to.name === 'signup') {
      next();
      return;
    }

    // Block all other routes until initialized
    if (!appStore.initialized) {
      next({ name: 'signup' });
      return;
    }

    // Check community membership for any route with communityId & redirect to join view if not a member
    const communityId = to.params.communityId;
    if (communityId && to.name !== 'join-community') {
      const neighbourhoodUrl = restoreNeighbourhoodPrefix(communityId as string);
      const isMember = appStore.myPerspectives.some((p) => p.sharedUrl === neighbourhoodUrl);
      if (!isMember) {
        next({ name: 'join-community', params: { communityId }, query: { redirect: to.fullPath } });
        return;
      }
    }

    // Allow all other navigation
    next();
  } catch (e) {
    console.log('Error in route guard:', e);
    // On error, redirect to signup unless already there
    if (to.name === 'signup') next();
    else next('/signup');
  }
});

// Update the route memory store on each route change
router.afterEach((to, from) => {
  const routeMemoryStore = useRouteMemoryStore();
  const { communityId, channelId, viewId } = to.params as RouteParams;

  // Set the current route
  routeMemoryStore.setCurrentRoute({ communityId, channelId, viewId });

  // If navigating to a community, store the last full route for the community & the last view visited in the channel
  if (communityId) {
    routeMemoryStore.setLastCommunityRoute(communityId, to.path, to.params);
    if (channelId && viewId) routeMemoryStore.setLastChannelView(communityId, channelId, viewId);
  }

  // Open call window when navigating to a channel from outside the app (e.g., shared link)
  if (to.name === 'channel' && !from.name) {
    const uiStore = useUiStore();
    uiStore.setCallWindowOpen(true);
  }
});

export default router;
