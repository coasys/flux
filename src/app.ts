import { createApp, h, provide } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store/index";

import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { WebSocketLink } from "@apollo/client/link/ws";
import { ApolloClients } from "@vue/apollo-composable";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";

export const apolloClient = new ApolloClient({
  link: new WebSocketLink({
    uri: `ws://localhost:4000/graphql`,
    options: {
      reconnect: true,
    },
  }),
  cache: new InMemoryCache({}),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "ignore",
    },
    query: {
      errorPolicy: "all",
    },
  },
});

createApp({
  setup() {
    provide(ApolloClients, {
      default: apolloClient,
    });
  },
  render: () => h(App),
})
  .use(store)
  .use(router)
  .mount("#app");
