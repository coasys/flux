import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainView from "@/views/main/MainView.vue";
import SignUp from "@/views/signup/SignUp.vue";
import CommunityView from "@/views/community/CommunityView.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import Settings from "@/containers/Settings.vue";
import ProfileView from "@/views/profile/ProfileView.vue";
import ConnectView from "@/views/connect/ConnectView.vue";
import UnlockAgent from "@/views/connect/UnlockAgent.vue";
import { ad4mClient, MainClient } from "@/app";
import { findAd4mPort } from "@/utils/findAd4minPort";

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

function checkConnection() {
  return new Promise(async (resolve, reject) => {
    const id = setTimeout(() => {
      resolve(false);
    }, 1000);

    await MainClient.ad4mClient.agent.status();

    clearTimeout(id);

    resolve(true);
  })
}

router.beforeEach(async (to, from, next) => {
  try {
    const status = await checkConnection();
    
    if (!status) {
      await findAd4mPort(MainClient.portSearchState === 'found' ? MainClient.port : undefined)
  
      await MainClient.ad4mClient.agent.status();
    }
  
    const { perspective } = await MainClient.ad4mClient.agent.me();

    const fluxLinksFound = perspective?.links.find(e => e.data.source.startsWith('flux://'));

    if (!fluxLinksFound && to.name !== 'signup') {
      next("/signup");
    } else if (to.name === "connect" || to.name === "unlock") {
      next("/home");
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
    } else if (to.name !== "connect" && e.message === "Couldn't find an open port") {
      next("/connect");
    } else {
      next();
    }
  }
});
