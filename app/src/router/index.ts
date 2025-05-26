import { ad4mConnect } from "@/ad4mConnect";
import { useAppStore, useRouteMemoryStore } from "@/stores";
import { RouteParams } from "@coasys/flux-types";
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
      const { me } = useAppStore();
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

// Update the route memory store when navigating within a community
router.afterEach((to) => {
  const { communityId, channelId, viewId } = to.params as RouteParams;
  if (communityId) {
    const routeMemory = useRouteMemoryStore();

    // Store the last full route for the community
    routeMemory.saveLastRoute(communityId, to.path, to.params);

    // Store the last view visited in the channel
    if (channelId && viewId) routeMemory.saveLastChannelView(communityId, channelId, viewId);
  }
});

export default router;
