import { createApp, h, watch } from "vue";
import App from "./App.vue";
import router from "./router";

import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";

import { createPinia } from "pinia";
import { Ad4mClient } from "@perspect3vism/ad4m";

import { ApolloClient, InMemoryCache, HttpLink, split, ApolloLink, NormalizedCacheObject } from "@apollo/client/core";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

type PortSearchStateType = "na" | "searching" | "found" | "not_found";

let ad4mClient: Ad4mClient;
let apolloClient: ApolloClient<NormalizedCacheObject>;

class Client {
  apolloClient: ApolloClient<NormalizedCacheObject>;
  ad4mClient: Ad4mClient;
  requestId: string;
  isFullyInitialized = false;
  port = 12000;
  portSearchState: PortSearchStateType = "na";

  constructor() {
    this.buildClient();
  }

  setPort(port: number) {
    console.warn("setting client port to", status);
    this.portSearchState = "found";
    this.port = port;
    localStorage.setItem("ad4minPort", port.toString());
    this.buildClient();
  }

  url() {
    return `ws://localhost:${this.port}/graphql`;
  }

  setToken(jwt: string) {
    console.log("1", jwt);
    localStorage.setItem("ad4minToken", jwt);
    this.buildClient();
  }

  token() {
    return localStorage.getItem("ad4minToken") || "";
  }

  setPortSearchState(state: PortSearchStateType) {
    this.portSearchState = state;
  }

  buildClient() {
    const wsLink = new GraphQLWsLink(createClient({
        url: this.url(),
        connectionParams: () => {
            return {
                headers: {
                    authorization: this.token()
                }
            }
        },
    }));

    localStorage.setItem("ad4minPort", this.port.toString());
  
    this.apolloClient = new ApolloClient({
        link: wsLink,
        cache: new InMemoryCache({ resultCaching: false, addTypename: false }),
        defaultOptions: {
            watchQuery: {
                fetchPolicy: "no-cache",
            },
            query: {
                fetchPolicy: "no-cache",
            }
        },
    });

    // @ts-ignore
    this.ad4mClient = new Ad4mClient(this.apolloClient);

    ad4mClient = this.ad4mClient;
    apolloClient = this.apolloClient;
  }

  async requestCapability(invalidateToken = false) {
    if (invalidateToken || !this.token()) {
      localStorage.removeItem("ad4minToken");

      this.buildClient();

      this.requestId = await this.ad4mClient.agent.requestCapability(
        "flux",
        "flux-desc",
        "fluxsocial.io",
        '[{"with":{"domain":"*","pointers":["*"]},"can":["*"]}]'
      );

      return true;
    } else {
      return false;
    }
  }

  async generateJwt(code: string) {
    const jwt = await this.ad4mClient.agent.generateJwt(this.requestId, code);
    this.setToken(jwt);
    this.isFullyInitialized = true;
  }
}

const pinia = createPinia();

export const MainClient = new Client();
export { ad4mClient, apolloClient };

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

const app = createApp({
  render: () => h(App),
})
  .use(pinia)
  .use(router)
  .mount("#app");
