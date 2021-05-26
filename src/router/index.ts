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
            path: ":perspectiveId",
            name: "perspective",
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

export default router;
