import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouteRecordRaw,
} from "vue-router";
import MainView from "@/views/main/MainView.vue";
import SignUp from "@/views/signup/SignUp.vue";
import CommunityView from "@/views/community/CommunityView.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import Settings from "@/containers/Settings.vue";
import ProfileView from "@/views/profile/ProfileView.vue";
import ProfileFeed from "@/views/profile/ProfileFeed.vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
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

export function checkConnection(): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const appStore = useAppStore();

    try {
      appStore.setGlobalLoading(true);

      const client = await getAd4mClient();

      const status = await client.agent.status();

      appStore.setGlobalLoading(false);

      resolve(status);
    } catch (e) {
      appStore.setGlobalLoading(false);
      reject();
    }
  });
}

router.beforeEach(async (to, from, next) => {
  try {
    const status = await checkConnection();
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
  } catch (e) {
    if (to.name !== "signup") {
      next("/signup");
    } else {
      next();
    }
  }
});
