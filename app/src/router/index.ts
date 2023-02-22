import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import Ad4mConnectUI from "@perspect3vism/ad4m-connect";

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
        component: () => import(`@/views/profile/ProfileView.vue`),
      },
      {
        path: "communities/:communityId",
        name: "community",
        component: () => import(`@/views/community/CommunityView.vue`),
        children: [
          {
            path: ":channelId",
            name: "channel",
            component: () => import(`@/views/channel/ChannelView.vue`),
          },
        ],
      },
      {
        path: "profile/:did",
        name: "profile",
        component: () => import(`@/views/profile/ProfileView.vue`),
      },
      {
        path: "settings",
        name: "settings",
        component: () => import(`@/containers/Settings.vue`),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

router.beforeEach(async (to, from, next) => {
  try {
    const connected = await isConnected();

    if (connected) {
      const client = await getAd4mClient();

      const { perspective } = await client.agent.me();

      const fluxLinksFound = perspective?.links.find((e) =>
        e.data.source.startsWith("flux://")
      );

      if (fluxLinksFound && to.name === "signup") {
        next("/home");
      }

      if (!fluxLinksFound && to.name !== "signup") {
        next("/signup");
      }

      next();
    } else {
      if (to.name !== "signup") {
        next("/signup");
      }

      next();
    }
  } catch (e) {
    if (to.name !== "signup") {
      next("/signup");
    } else {
      next();
    }
  }
});

function isConnected() {
  return new Promise((resolve, reject) => {
    const ui = Ad4mConnectUI({
      appName: "Flux",
      appDesc: "A Social Toolkit for the New Internet",
      appDomain: "",
      appIconPath: "https://i.ibb.co/GnqjPJP/icon.png",
      capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
    });

    ui.addEventListener("connectionstatechange", async (e) => {
      if (
        ui.connectionState === "connected" &&
        ui.authState === "unauthenticated"
      ) {
        resolve(false);
      } else {
        resolve(true);
      }
    });

    ui.addEventListener("authstatechange", async (e) => {
      if (ui.authState === "authenticated") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}
