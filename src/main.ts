import { createApp, h, provide } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store/index";
import VueVirtualScroller from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import VTooltip from "v-tooltip";
import "v-tooltip/dist/v-tooltip.css";

import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { WebSocketLink } from "@apollo/client/link/ws";
import { ApolloClients } from "@vue/apollo-composable";

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true,
  },
});

export const apolloClient = new ApolloClient({
  //uri: 'http://localhost:4000',
  link: wsLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "ignore",
    },
    query: {
      fetchPolicy: "no-cache",
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
  .use(VueVirtualScroller)
  .use(VTooltip)
  .mount("#app");
