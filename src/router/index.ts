import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  createWebHashHistory,
} from "vue-router";
import AppView from "./../views/app-view/AppView.vue";
import WelcomeView from "./../views/welcome-view/WelcomeView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "welcome view",
    component: WelcomeView,
  },
  {
    path: "/home",
    name: "home",
    component: AppView,
  },
];

const router = createRouter({
  history: process.env.IS_ELECTRON
    ? createWebHashHistory()
    : createWebHistory(),
  routes,
});

export default router;
