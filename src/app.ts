import { createApp, h, provide, watch } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";

import { ApolloClients } from "@vue/apollo-composable";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";
import { apolloClient } from "./utils/setupApolloClient";

import { createPinia } from "pinia";

const pinia = createPinia();

pinia.use(({ store }) => {
  const key = store.$id;
  const localState = localStorage.getItem(key);

  if (localState) {
    store.$patch(JSON.parse(localState));
    localStorage.setItem(key, JSON.stringify(store.$state));
  }

  watch(store.$state, () => {
    localStorage.setItem(key, JSON.stringify(store.$state));
  });
});

createApp({
  setup() {
    provide(ApolloClients, {
      default: apolloClient,
    });
  },
  render: () => h(App),
})
  .use(pinia)
  .use(router)
  .mount("#app");
