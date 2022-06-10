import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainView from "@/views/main/MainView.vue";
import SignUp from "@/views/signup/SignUp.vue";
import LogIn from "@/views/login/LogIn.vue";
import CommunityView from "@/views/community/CommunityView.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import Settings from "@/containers/Settings.vue";
import ProfileView from "@/views/profile/ProfileView.vue";
import ConnectView from "@/views/connect/ConnectView.vue";
import { ad4mClient, MainClient } from "@/app";
import { nextDay } from "date-fns";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/connect",
    name: "connect",
    component: ConnectView,
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

function portIsOpen(url: string) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onerror = () => {
      reject(false);
    };
    ws.onopen = () => {
      resolve(true);
    };
  });
}

export default router;

router.beforeEach(async (to, from, next) => {
  const url = MainClient.url();

  try {
    await portIsOpen(url);
    if (to.name === "connect") {
      next("/home");
    } else {
      next();
    }
  } catch (e) {
    if (to.name === "connect") next();
    else next("/connect");
  }
});
