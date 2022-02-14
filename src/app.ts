import { createApp, h, watch } from "vue";
import App from "./App.vue";
import router from "./router";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";

import { createPinia } from "pinia";
import { Ad4mClient } from "@perspect3vism/ad4m";

import { TimeoutCache } from "./utils/timeoutCache";
import { ProfileExpression } from "./store/types";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";

const PORT = parseInt(global.location.search.slice(6)) || 4000;

export const apolloClient = new ApolloClient({
  link: new WebSocketLink({
    uri: `ws://localhost:${PORT}/graphql`,
    options: {
      reconnect: true,
    },
  }),
  cache: new InMemoryCache({ resultCaching: false }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "ignore",
      fetchPolicy: "no-cache",
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "no-cache",
    },
    mutate: {
      fetchPolicy: "no-cache",
    },
  },
});

export const profileCache = new TimeoutCache<ProfileExpression>(1000 * 60 * 5);
const pinia = createPinia();

// @ts-ignore
export const ad4mClient = new Ad4mClient(apolloClient);

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
  render: () => h(App),
})
  .use(pinia)
  .use(router)
  .mount("#app");
