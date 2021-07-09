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
import HomeView from "@/views/home-view/HomeView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signup",
    name: "signup",
    component: WelcomeView,
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
      },
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
  console.log(to);
  return true;
});

export default router;
