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
      </j-flex>
    </div>
  </div>
  <j-modal
    size="sm"
    :open="modals.showCode"
    @toggle="(e) => setShowCode(e.target.open)"
  >
    <connect-client
      @submit="() => setShowCode(false)"
      @cancel="() => setShowCode(false)"
    />
  </j-modal>
</template>

<script lang="ts">
import { useRoute, useRouter } from "vue-router";
import { defineComponent, computed, watch } from "vue";
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
import { ad4mClient, MainClient } from "@/app";
import { useUserStore } from "./store/user";
import { useAppStore } from "./store/app";
import { useDataStore } from "./store/data";
import { JUNTO_AGENT, AD4M_AGENT, KAICHAO_AGENT } from "@/constants/agents";
import { MEMBER, EXPRESSION, CHANNEL } from "./constants/neighbourhoodMeta";
import useEventEmitter from "./utils/useEventEmitter";
import { mapActions } from "pinia";
import ConnectClient from "@/containers/ConnectClient.vue";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  components: {
    ConnectClient,
  },
  async setup() {
    const router = useRouter();
    const route = useRoute();
    const userStore = useUserStore();
    const appStore = useAppStore();
    const dataStore = useDataStore();

    const PORT = 12000;

    //Start expression web worker to try and get the expression data pointed to in link target
    const expressionWorker = new Worker("/pollingWorker.js");

    expressionWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    expressionWorker.addEventListener("message", (e) => {
      const perspective = e.data.callbackData.perspective;
      const link = e.data.callbackData.link;
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

    //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
    const newLinkHandler = async (
      link: LinkExpression,
      perspective: string
    ) => {
      console.debug("GOT INCOMING MESSAGE SIGNAL", link, perspective);
      if (link.data!.predicate! === EXPRESSION) {
        expressionWorker.postMessage({
          id: link.data!.target!,
          retry: expressionGetRetries,
          callbackData: { perspective, link },
          interval: expressionGetDelayMs,
          query: print(GET_EXPRESSION),
          variables: { url: link.data!.target! },
          name: "Expression signal get",
          dataKey: "expression",
          port: PORT,
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
      } else if (
        link.data!.predicate! === CHANNEL &&
        link.author != userStore.getUser?.agent.did
      ) {
        console.log("Joining channel via link signal!");
        await dataStore.joinChannelNeighbourhood({
          parentCommunityId: perspective,
          neighbourhoodUrl: link.data!.target!,
        });
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
            MainClient.ad4mClient.perspective.addPerspectiveLinkAddedListener(
              k,
              (result: any) => {
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
              }
            );
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

    MainClient.ad4mClient.agent.status().then((status) => {
      this.userStore.updateAgentStatus(status);
    });
  },

  mounted() {
    MainClient.requestCapability().then((val) => {
      if (val) {
        this.setShowCode(true);
      }
    });
  },

  methods: {
    ...mapActions(useAppStore, ["setShowCode"]),
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
