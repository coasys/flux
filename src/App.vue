<template>
  <router-view />
  <j-toast
    :open="toast.open"
    autohide="10"
    @toggle="(e) => setToast({ open: e.target.open })"
    :variant="toast.variant"
  >
    {{ toast.message }}
  </j-toast>
  <div class="global-loading" v-if="ui.showGlobalLoading">
    <div class="global-loading__backdrop"></div>
    <div class="global-loading__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg"> </j-spinner>
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>
  <div class="global-error" v-if="globalError.show">
    <div class="global-error__backdrop"></div>
    <div class="global-error__content">
      <j-flex a="center" direction="column" gap="900">
        <j-text nomargin variant="heading-lg"
          >Whoops, something broke! 😅</j-text
        >
        <j-text nomargin v-if="globalError.message" variant="subheading">
          Please report this message to us:
        </j-text>
        <div class="global-error__message">
          {{ globalError.message }}
        </div>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import { gql } from "@apollo/client/core";
import { defineComponent, computed } from "vue";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";
import { expressionGetDelayMs, expressionGetRetries } from "@/core/juntoTypes";
import { AGENT_STATUS, GET_EXPRESSION } from "@/core/graphql_queries";
import { ModalsState, NeighbourhoodState, ToastState } from "@/store/types";
import { print } from "graphql/language/printer";
import { AgentStatus, LinkExpression } from "@perspect3vism/ad4m";
import store from "@/store";
import { apolloClient } from "./utils/setupApolloClient";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const router = useRouter();
    const route = useRoute();
    //const store = useStore();

    onError((error) => {
      console.log("Got global graphql error, logging with error", error);
      if (process.env.NODE_ENV !== "production") {
        // can use error.operation.operationName to single out a query type.
        logErrorMessages(error);

        store.commit.showDangerToast({
          message: JSON.stringify(error),
        });
      }
    });

    //Watch for agent unlock to set off running queries
    store.original.watch(
      (state: any) => state.user.agent.isUnlocked,
      async (newValue: any) => {
        console.log("agent unlocked changed to", newValue);
        if (newValue) {
          store.commit.setApplicationStartTime(new Date());
          store.dispatch.loadExpressionLanguages();
        } else {
          router.push({
            name: store.state.user.agent.isInitialized ? "login" : "signup",
          });
        }
      },
      { immediate: true }
    );

    //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
    const newLinkHandler = async (
      link: LinkExpression,
      perspective: string
    ) => {
      console.log("GOT INCOMING MESSAGE SIGNAL", link, perspective);
      if (link.data!.predicate! == "sioc://content_of") {
        //Start expression web worker to try and get the expression data pointed to in link target
        const expressionWorker = new Worker("pollingWorker.js");

        expressionWorker.postMessage({
          retry: expressionGetRetries,
          interval: expressionGetDelayMs,
          query: print(GET_EXPRESSION),
          variables: { url: link.data!.target! },
          name: "Expression signal get",
          dataKey: "expression",
        });

        expressionWorker.onerror = function (e) {
          throw new Error(e.toString());
        };

        expressionWorker.addEventListener("message", (e) => {
          const expression = e.data.expression;
          const message = JSON.parse(expression!.data!);

          console.log("FOUND EXPRESSION FOR SIGNAL");
          //Add the expression to the store
          store.commit.addExpressionAndLink({
            channelId: perspective,
            link: link,
            message: expression,
          });

          store.dispatch.showMessageNotification({
            router,
            route,
            perspectiveUuid: perspective,
            authorDid: expression!.author,
            message: message.body,
          });

          //Add UI notification on the channel to notify that there is a new message there
          store.commit.setHasNewMessages({
            channelId: perspective,
            value: true,
          });
        });
      }
    };

    let watching: string[] = [];
    store.original.watch(
      (state) => state.data.neighbourhoods,
      async (newValue: { [perspectiveUuid: string]: NeighbourhoodState }) => {
        for (let [k, v] of Object.entries(newValue)) {
          if (watching.filter((val) => val == k).length == 0) {
            console.log("Starting watcher on perspective", k);
            watching.push(k);
            apolloClient
              .subscribe({
                query: gql` subscription {
                  perspectiveLinkAdded(uuid: "${v.perspective.uuid}") {
                    author
                    timestamp
                    data { source, predicate, target }
                    proof { valid, invalid, signature, key }
                  }
                }`,
              })
              .subscribe({
                next: (result) => {
                  console.debug(
                    "Got new link with data",
                    result.data,
                    "and channel",
                    v
                  );
                  newLinkHandler(
                    result.data.perspectiveLinkAdded,
                    v.perspective.uuid
                  );
                },
                error: (e) => {
                  throw Error(e);
                },
              });
          }
        }
      },
      { immediate: true, deep: true }
    );

    return {
      toast: computed(() => store.state.app.toast),
      setToast: (payload: ToastState) => store.commit.setToast(payload),
    };
  },
  computed: {
    ui() {
      return store.state.app;
    },
    globalError(): { show: boolean; message: string } {
      return store.state.app.globalError;
    },
    modals(): ModalsState {
      return store.state.app.modals;
    },
  },
  beforeCreate() {
    //Reset globalError & loading states in case application was exited with these states set to true before
    store.commit.setGlobalError({
      show: false,
      message: "",
    });
    store.commit.setGlobalLoading(false);

    window.api.send("getLangPath");

    window.api.receive("unlockedStateOff", () => {
      store.commit.updateAgentLockState(false);
    });

    window.api.receive("getLangPathResponse", (data: string) => {
      // console.log(`Received language path from main thread: ${data}`);
      store.commit.setLanguagesPath(data);
    });

    window.api.receive("windowState", (data: string) => {
      console.log(`setWindowState: ${data}`);
      //@ts-ignore
      store.commit.setWindowState(data);
    });

    window.api.receive("update_available", () => {
      store.commit.setUpdateState({ updateState: "available" });
    });

    window.api.receive("update_not_available", () => {
      store.commit.setUpdateState({ updateState: "not-available" });
    });

    window.api.receive("update_downloaded", () => {
      store.commit.setUpdateState({ updateState: "downloaded" });
    });

    window.api.receive("download_progress", () => {
      store.commit.setUpdateState({ updateState: "downloading" });
    });

    window.api.receive("setGlobalLoading", (val: boolean) => {
      store.commit.setGlobalLoading(val);
    });

    window.api.receive(
      "globalError",
      (payload: { show: boolean; message: string }) => {
        store.commit.setGlobalError(payload);
      }
    );

    const { onResult, onError } = useQuery<{
      agentStatus: AgentStatus;
    }>(AGENT_STATUS);
    onResult((val) => {
      store.commit.updateAgentStatus(val.data.agentStatus);
      if (val.data.agentStatus.isInitialized == true) {
        //Get database perspective from store
        let databasePerspective = store.getters.getDatabasePerspective;
        if (!databasePerspective) {
          console.warn(
            "Does not have databasePerspective in store but has already been init'd! Add logic for getting databasePerspective as found with name"
          );
          //TODO: add the retrieval/state saving logic here
        }
      }
    });
    onError((error) => {
      console.log("WelcomeViewRight: AGENT_SERVICE_STATUS, error:", error);
    });
  },
});
</script>

<style>
body {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  padding: 0;
  margin: 0;
  color: var(--j-color-ui-500);
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

* {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --app-main-sidebar-bg-color: hsl(var(--j-color-ui-hue), 0%, 100%);
  --app-main-sidebar-border-color: var(--j-border-color);
  --app-drawer-bg-color: hsl(var(--j-color-ui-hue), 0%, 100%);
  --app-drawer-border-color: var(--j-border-color);
  --app-channel-bg-color: var(--j-color-white);
  --app-channel-border-color: var(--j-border-color);
  --app-channel-header-bg-color: var(--j-color-white);
  --app-channel-footer-bg-color: var(--j-color-white);
}

html[font-size="sm"] {
  font-size: 13px;
}

html[font-size="md"] {
  font-size: 14px;
}

html[font-size="lg"] {
  font-size: 15px;
}

@media (min-width: 800px) {
  html[font-size="sm"] {
    font-size: 14px;
  }
  html[font-size="md"] {
    font-size: 16px;
  }
  html[font-size="lg"] {
    font-size: 17px;
  }
}

j-avatar::part(base) {
  transition: box-shadow 0.2s ease;
}

.global-loading {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
}

.global-error {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
}

.global-loading__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.8;
  backdrop-filter: blur(15px);
}

.global-loading__content {
  position: relative;
}

.global-error__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.8;
  backdrop-filter: blur(15px);
}

.global-error__content {
  text-align: center;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  padding-top: var(--j-space-600);
  padding-bottom: var(--j-space-600);
  color: var(--j-color-ui-300);
}

.global-error__message {
  text-align: left;
  background: var(--j-color-ui-800);
  padding: var(--j-space-500);
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 20px;
}

.global-loading j-spinner {
  --j-spinner-size: 80px;
}

.bug-icon::part(base) {
  width: 100px;
  height: 100px;
}

/* apply a natural box layout model to all elements, but allowing components to change */
html {
  box-sizing: border-box;
}
*,
*:before,
*:after {
  box-sizing: inherit;
}
</style>
