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
    meta: { public: true },
  },
  {
    path: '/join-call',
    name: 'join-call',
    component: () => import(`@/views/JoinCallView.vue`),
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
    ],
  },
];

const router = createRouter({ history: createWebHashHistory(), routes });

// Handle authentication and route guarding
router.beforeEach(async (to, from, next) => {
  try {
    const appStore = useAppStore();
    const { me } = storeToRefs(appStore);

    // If client not initialized yet, only allow public routes
    if (!appStore.clientReady) {
      const isPublicRoute = to.name === 'signup' || to.meta.public;
      if (isPublicRoute) next();
      else next({ name: 'signup' });
      return;
    }

    // If client ready but profile not loaded yet, only allow signup route
    if (!me.value.did) {
      if (to.name === 'signup') next();
      else next({ name: 'signup' });
      return;
    }

    // Ensure perspective is loaded before checking for Flux account
    if (!me.value.perspective) {
      try {
        await appStore.refreshMyProfile();
      } catch (error) {
        console.error('Router guard: Failed to refresh profile:', error);
        if (to.name === 'signup') next();
        else next({ name: 'signup' });
        return;
      }
    }

    // Check if user has created a Flux account
    const hasFluxAccount = me.value.perspective?.links.some((e) => e.data.source.startsWith('flux://'));
    const isOnSignupOrMain = to.name === 'signup' || to.name === 'main';

    // User has Flux account but is on signup/main - redirect to home
    if (hasFluxAccount && isOnSignupOrMain) {
      await appStore.refreshMyProfile();
      next('/home');
    } 
    // User doesn't have Flux account but trying to access protected routes - redirect to signup
    else if (!hasFluxAccount && !isOnSignupOrMain) {
      next('/signup');
    } 
    // All other cases - allow navigation
    else {
      next();
    }
  } catch (e) {
    console.log('Error in route guard:', e);
    // On error, redirect to signup unless already there
    if (to.name === 'signup') next();
    else next('/signup');
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
