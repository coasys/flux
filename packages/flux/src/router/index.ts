import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import MainView from "@/views/main/MainView.vue";
import SignUp from "@/views/signup/SignUp.vue";
import CommunityView from "@/views/community/CommunityView.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import Settings from "@/containers/Settings.vue";
import ProfileView from "@/views/profile/ProfileView.vue";
import ProfileFeed from "@/views/profile/ProfileFeed.vue";
import {
  getAd4mClient,
  isConnected,
} from "@perspect3vism/ad4m-connect/dist/utils";
import { useAppStore } from "@/store/app";

const routes: Array<RouteRecordRaw> = [
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
  history: createWebHashHistory(),
  routes,
});

export default router;

router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore();

  try {
    const connected = await isConnected();

    if (connected) {
      const client = await getAd4mClient();

      appStore.setGlobalLoading(true);

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
      if (to.name !== "signup") {
        next("/signup");
      } else {
        next();
      }
    }
  } catch (e) {
    if (to.name !== "signup") {
      next("/signup");
    } else {
      next();
    }
  } finally {
    appStore.setGlobalLoading(false);
  }
});
