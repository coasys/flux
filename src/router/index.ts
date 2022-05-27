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
import Foundation from "@/views/home-view/Foundation.vue";
import PrivacyPolicy from "@/views/home-view/PrivacyPolicy.vue";
import Faq from "@/views/home-view/Faq.vue";
import Tutorial from "@/views/home-view/Tutorial.vue";

import ProfileFeed from "@/views/profile-feed/ProfileFeed.vue";
import ProfileView from "@/views/profile-view/ProfileView.vue";

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
        component: ProfileView,
        // redirect: { name: "my-communities" },
        children: [
          // {
          //   path: "settings",
          //   name: "settings",
          //   component: Settings,
          // },
          // {
          //   path: "my-feed",
          //   name: "my-feed",
          //   component: ProfileFeed,
          // },
          // {
          //   path: "communities",
          //   name: "my-communities",
          //   component: MyCommunities,
          // },
          // {
          //   path: "profile",
          //   name: "my-profile",
          //   component: ProfileView,
          // },
          // {
          //   path: "tutorial",
          //   name: "tutorial",
          //   component: Tutorial,
          // },
          // {
          //   path: "foundation",
          //   name: "foundation",
          //   component: Foundation,
          // },
          // {
          //   path: "faq",
          //   name: "faq",
          //   component: Faq,
          // },
          // {
          //   path: "privacy-policy",
          //   name: "privacy-policy",
          //   component: PrivacyPolicy,
          // },
        ],
      },
      {
        path: "feed",
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
