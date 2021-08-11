import { createApp, h, provide } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

import { ApolloClients } from "@vue/apollo-composable";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";
import { apolloClient } from "./utils/setupApolloClient";

createApp({
  setup() {
    provide(ApolloClients, {
      default: apolloClient,
    });
  },
  render: () => h(App),
})
  .use(store.original)
  .use(router)
  .mount("#app");
