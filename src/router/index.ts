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
import CommunityWelcomeView from "@/views/community-view/CommunityWelcomeView.vue";
import ChannelView from "@/views/channel-view/ChannelView.vue";

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
  console.log(to);
  return true;
});

export default router;
