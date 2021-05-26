import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  createWebHashHistory,
} from "vue-router";
import AppView from "./../views/app-view/AppView.vue";
import WelcomeView from "./../views/welcome-view/WelcomeView.vue";
import CommunityView from "./../views/community-view/CommunityView.vue";
import MainView from "./../views/community-view/main-view/MainView.vue";
import store from "../store";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signup",
    name: "signup",
    component: WelcomeView,
  },
  {
    path: "/",
    name: "home",
    component: AppView,
    children: [
      {
        path: "communities/:communityId",
        name: "community",
        component: CommunityView,
        children: [
          {
            path: ":channelId",
            name: "channel",
            component: MainView,
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
  if (to.params.communityId) {
    // TODO: We should not need to changeCommunityView
    // We should just fetch current channel based on params on each component
    store.commit({
      type: "changeCommunityView",
      value: {
        name: "Hello",
        type: "channel",
        perspective: to.params.channelId,
      },
    });
  }

  return true;
});

export default router;
