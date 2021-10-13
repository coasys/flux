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
        <j-text nomargin variant="heading">
          If you have also been asked to include a log file with your report,
          click the button below to copy a log file to your desktop:
        </j-text>
        <j-button @click="copyLogFile" variant="primary">Copy</j-button>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { useRoute, useRouter } from "vue-router";
import { gql } from "@apollo/client/core";
import { defineComponent, computed, watch } from "vue";
import { onError } from "@apollo/client/link/error";
import { expressionGetDelayMs, expressionGetRetries } from "@/constants/config";
import { GET_EXPRESSION } from "@/core/graphql_queries";
import {
  ApplicationState,
  ModalsState,
  NeighbourhoodState,
  ToastState,
} from "@/store/types";
import { print } from "graphql/language/printer";
import { LinkExpression } from "@perspect3vism/ad4m";
import { apolloClient } from "@/app";
import { useUserStore } from "./store/user";
import { useAppStore } from "./store/app";
import { useDataStore } from "./store/data";
import { addTrustedAgents } from "@/core/mutations/addTrustedAgents";
import { JUNTO_AGENT, AD4M_AGENT } from "@/constants/agents";
import { ad4mClient } from "./app";
import { MEMBER } from "./constants/neighbourhoodMeta";

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
    const userStore = useUserStore();
    const appStore = useAppStore();
    const dataStore = useDataStore();

    onError((error) => {
      console.log("Got global graphql error, logging with error", error);
      if (process.env.NODE_ENV !== "production") {
        appStore.showDangerToast({
          message: JSON.stringify(error),
        });
      }
    });

    //Watch for agent unlock to set off running queries
    userStore.$subscribe(async (mutation, state) => {
      if (state.agent.isUnlocked) {
        appStore.setApplicationStartTime(new Date());
        await addTrustedAgents([JUNTO_AGENT, AD4M_AGENT]);
      } else {
        router.push({
          name: userStore.agent.isInitialized ? "login" : "signup",
        });
      }
    });

    //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
    const newLinkHandler = async (
      link: LinkExpression,
      perspective: string
    ) => {
      console.debug("GOT INCOMING MESSAGE SIGNAL", link, perspective);
      if (link.data!.predicate! === "sioc://content_of") {
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

          console.debug("FOUND EXPRESSION FOR SIGNAL");
          //Add the expression to the store
          dataStore.addExpressionAndLink({
            channelId: perspective,
            link: link,
            message: expression,
          });

          dataStore.showMessageNotification({
            router,
            route,
            perspectiveUuid: perspective,
            authorDid: expression!.author,
            message: message.body,
          });

          //Add UI notification on the channel to notify that there is a new message there
          dataStore.setHasNewMessages({
            channelId: perspective,
            value: true,
          });
        });
      } else if (link.data!.predicate! === MEMBER) {
        const did = link.data!.target!.split("://")[1];
        console.log("Got new member in signal! Parsed out did: ", did);
        if (did) {
          dataStore.setNeighbourhoodMember({
            member: did,
            perspectiveUuid: perspective,
          });
        }
      }
    };

    let watching: string[] = [];
    watch(
      dataStore.neighbourhoods,
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
      toast: computed(() => appStore.toast),
      setToast: (payload: ToastState) => appStore.setToast(payload),
      userStore,
      appStore,
      dataStore,
    };
  },
  computed: {
    ui(): ApplicationState {
      return this.appStore.$state;
    },
    globalError(): { show: boolean; message: string } {
      return this.appStore.globalError;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
  beforeCreate() {
    // Initialize theme
    this.appStore.changeCurrentTheme("global");

    this.dataStore.clearMessages();
    //Reset globalError & loading states in case application was exited with these states set to true before
    this.appStore.setGlobalError({
      show: false,
      message: "",
    });
    this.appStore.setGlobalLoading(false);

    window.api.send("getLangPath");

    window.api.receive("unlockedStateOff", () => {
      this.userStore.updateAgentLockState(false);
    });

    window.api.receive("clearMessages", () => {
      this.dataStore.clearMessages();
    });

    window.api.receive("getLangPathResponse", (data: string) => {
      // console.log(`Received language path from main thread: ${data}`);
      this.appStore.setLanguagesPath(data);
    });

    window.api.receive("windowState", (data: string) => {
      console.log(`setWindowState: ${data}`);
      //@ts-ignore
      this.appStore.setWindowState(data);
    });

    window.api.receive("update_available", () => {
      this.appStore.setUpdateState({ updateState: "available" });
    });

    window.api.receive("update_not_available", () => {
      this.appStore.setUpdateState({ updateState: "not-available" });
    });

    window.api.receive("update_downloaded", () => {
      this.appStore.setUpdateState({ updateState: "downloaded" });
    });

    window.api.receive("download_progress", () => {
      this.appStore.setUpdateState({ updateState: "downloading" });
    });

    window.api.receive("setGlobalLoading", (val: boolean) => {
      this.appStore.setGlobalLoading(val);
    });

    window.api.receive(
      "globalError",
      (payload: { show: boolean; message: string }) => {
        this.appStore.setGlobalError(payload);
      }
    );

    ad4mClient.agent.status().then((status) => {
      this.userStore.updateAgentStatus(status);
    });
  },
  methods: {
    copyLogFile() {
      window.api.send("copyLogs");
      this.appStore.showSuccessToast({
        message:
          "Log file called debug.log been copied to your desktop, please upload to Junto Discord, thanks <3",
      });
    },
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

body :not(.message-item__message) {
  user-select: none;
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
  --app-main-sidebar-bg-color: var(--j-color-white);
  --app-main-sidebar-border-color: var(--j-border-color);
  --app-drawer-bg-color: var(--j-color-white);
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
