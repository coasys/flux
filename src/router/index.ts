import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainView from "@/views/main/MainView.vue";
import SignUp from "@/views/signup/SignUp.vue";
import CommunityView from "@/views/community/CommunityView.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import Settings from "@/containers/Settings.vue";
import ProfileView from "@/views/profile/ProfileView.vue";
import ConnectView from "@/views/connect/ConnectView.vue";
import UnlockAgent from "@/views/connect/UnlockAgent.vue";
import ProfileFeed from "@/views/profile/ProfileFeed.vue";
import { getAd4mClient } from '@perspect3vism/ad4m-connect/dist/web'

const routes: Array<RouteRecordRaw> = [
  {
    path: "/connect",
    name: "connect",
    component: ConnectView,
  },
  {
    path: "/unlock",
    name: "unlock",
    component: UnlockAgent,
  },
  {
    path: "/signup",
    name: "signup",
    component: SignUp,
  },
  {
    path: "/",
    name: "main",
    component: MainView,
    redirect: { name: "home" },
    children: [
      {
        path: "home",
        name: "home",
        component: ProfileView,
      },
      {
        path: "feed/:fid",
        name: "profile-feed",
        component: ProfileFeed,
      },
      {
        path: "communities/:communityId",
        name: "community",
        component: CommunityView,
        children: [
          {
            path: ":channelId",
            name: "channel",
            component: ChannelView,
          },
        ],
      },
      {
        path: "profile/:did",
        name: "profile",
        component: ProfileView,
      },
      {
        path: "settings",
        name: "settings",
        component: Settings,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

export function checkConnection() {
  return new Promise(async (resolve, reject) => {
    const id = setTimeout(() => {
      resolve(false);
    }, 1000);

    const client = await getAd4mClient();

    await client.agent.status();

    clearTimeout(id);

    resolve(true);
  });
}

router.beforeEach(async (to, from, next) => {
  try {
    const status = await checkConnection();

    if (status) {
      const client = await getAd4mClient();

      const { perspective } = await client.agent.me();

      const fluxLinksFound = perspective?.links.find((e) =>
        e.data.source.startsWith("flux://")
      );

      if (!fluxLinksFound && to.name !== "signup") {
        next("/signup");
      } else {
        next();
      }
    } else {
      next();
    }
  } catch (e) {
    console.log({ e, to });
    if (
      to.name !== "unlock" &&
      e.message ===
        "Cannot extractByTags from a ciphered wallet. You must unlock first."
    ) {
      next("/unlock");
    } else if (
      to.name !== "connect" &&
      e.message === "Couldn't find an open port"
    ) {
      next("/connect");
    } else {
      next();
    }
  }
});
