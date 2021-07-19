import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  createWebHashHistory,
} from "vue-router";
import MainView from "@/views/main-view/MainView.vue";
import SignUp from "@/views/signup/SignUp.vue";
import LogIn from "@/views/login/LogIn.vue";
import CommunityView from "@/views/community-view/CommunityView.vue";
import ChannelView from "@/views/channel-view/ChannelView.vue";
import HomeView from "@/views/home-view/HomeView.vue";
import Settings from "@/containers/Settings.vue";
import MyCommunities from "@/containers/MyCommunities.vue";
import MyProfile from "@/containers/MyProfile.vue";

import JuntoFoundation from "@/views/home-view/JuntoFoundation.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signup",
    name: "signup",
    component: SignUp,
  },
  {
    path: "/login",
    name: "login",
    component: LogIn,
  },
  {
    path: "/",
    name: "main",
    component: MainView,
    children: [
      {
        path: "home",
        name: "home",
        component: HomeView,
        redirect: { name: "my-communities" },
        children: [
          {
            path: "settings",
            name: "settings",
            component: Settings,
          },
          {
            path: "communities",
            name: "my-communities",
            component: MyCommunities,
          },
          {
            path: "profile",
            name: "my-profile",
            component: MyProfile,
          },
          {
            path: "junto-foundation",
            name: "junto-foundation",
            component: JuntoFoundation,
          },
        ],
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
    ],
  },
];

const router = createRouter({
  history: process.env.IS_ELECTRON
    ? createWebHashHistory()
    : createWebHistory(),
  routes,
});

export default router;
