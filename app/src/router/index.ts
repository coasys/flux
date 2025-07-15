import { ad4mConnect } from "@/ad4mConnect";
import { useAppStore, useRouteMemoryStore } from "@/stores";
import { RouteParams } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signup",
    name: "signup",
    component: () => import(`@/views/signup/SignUp.vue`),
  },
  {
    path: "/update-ad4m",
    name: "update-ad4m",
    component: () => import(`@/views/update/UpdateAd4m.vue`),
  },
  {
    path: "/",
    name: "main",
    component: () => import(`@/views/main/MainView.vue`),
    redirect: { name: "home" },
    children: [
      {
        path: "home",
        name: "home",
        component: () => import(`@/views/main/profile/ProfileView.vue`),
      },
      {
        path: "communities/:communityId",
        props: true,
        name: "community",
        component: () => import(`@/views/main/community/CommunityView.vue`),
        children: [
          {
            path: ":channelId",
            props: true,
            name: "channel",
            component: () => import(`@/views/main/community/channel/ChannelView.vue`),
            children: [
              {
                path: ":viewId",
                props: true,
                name: "view",
                component: () => import(`@/views/main/community/channel/view/ViewView.vue`),
              },
            ],
          },
        ],
      },
      {
        path: "profile/:did",
        props: true,
        name: "profile",
        component: () => import(`@/views/main/profile/ProfileView.vue`),
      },
      {
        path: "settings",
        name: "settings",
        component: () => import(`@/containers/Settings.vue`),
      },
    ],
  },
];

const router = createRouter({ history: createWebHashHistory(), routes });

// Handle login routing
router.beforeEach(async (to, from, next) => {
  try {
    const isAuthenticated = await ad4mConnect.isAuthenticated();
    if (isAuthenticated) {
      const appStore = useAppStore();
      const { ad4mClient } = storeToRefs(appStore);
      const me = await ad4mClient.value.agent.me();

      // Handle authenticated routes
      const fluxAccountCreated = me.perspective?.links.find((e) => e.data.source.startsWith("flux://"));
      const isOnSignupOrMain = to.name === "signup" || to.name === "main";
      if (fluxAccountCreated && isOnSignupOrMain) next("/home");
      if (!fluxAccountCreated && !isOnSignupOrMain) next("/signup");

      next();
    } else {
      // If not logged in, redirect to signup
      if (to.name !== "signup") next("/signup");
      next();
    }
  } catch (e) {
    console.log("Error in route", e);
    if (to.name !== "signup") next("/signup");
    else next();
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
