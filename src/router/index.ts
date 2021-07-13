import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  createWebHashHistory,
} from "vue-router";
import MainView from "@/views/main-view/MainView.vue";
import WelcomeView from "@/views/welcome-view/WelcomeView.vue";
import CommunityView from "@/views/community-view/CommunityView.vue";
import CommunityWelcomeView from "@/views/community-view/CommunityWelcomeView.vue";
import ChannelView from "@/views/channel-view/ChannelView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signup",
    name: "signup",
    component: WelcomeView,
  },
  {
    path: "/",
    name: "home",
    component: MainView,
    children: [
      {
        path: "communities/:communityId",
        name: "community",
        component: CommunityView,
        // explicitly reroute to default child on named navigation
        // https://github.com/vuejs/vue-router/issues/822#issuecomment-255685008
        redirect: { name: "communitywelcome" },
        children: [
          {
            path: "",
            name: "communitywelcome",
            component: CommunityWelcomeView,
          },
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

router.beforeEach((to, from) => {
  return true;
});

export default router;
