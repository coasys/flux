import { createApp, h, provide } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";

import { ApolloClients } from "@vue/apollo-composable";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";
import { apolloClient } from "./utils/setupApolloClient";

import { createPinia } from 'pinia';

const pinia = createPinia();

pinia.use(({ store }) => {
  store.$subscribe(() => {
    localStorage.setItem('pinia', JSON.stringify(store.$state))
  });

  const localState = localStorage.getItem('pinia');

  if (localState) {
    store.$patch(JSON.parse(localState))
  }
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
