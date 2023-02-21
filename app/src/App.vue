<template>
  <router-view :key="componentKey" @connectToAd4m="connectToAd4m"></router-view>
  <div class="global-modal" v-if="ui.showGlobalLoading">
    <div class="global-modal__backdrop"></div>
    <div class="global-modal__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg"> </j-spinner>
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>
  <div class="global-modal" v-if="ui.globalError.show">
    <div class="global-modal__backdrop"></div>
    <div class="global-modal__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-icon
          name="exclamation-triangle"
          size="xl"
          color="danger-500"
        ></j-icon>
        <j-text color="danger-500" weight="600" size="700">
          {{ ui.globalError.message }}
        </j-text>
      </j-flex>
    </div>
  </div>

  <j-toast
    autohide="10"
    :variant="ui.toast.variant"
    :open="ui.toast.open"
    @toggle="(e: any) => appStore.setToast({ open: e.target.open })"
  >
    <j-text>{{ ui.toast.message }}</j-text>
  </j-toast>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useAppStore } from "./store/app";
import { ApplicationState, ModalsState } from "@/store/types";
import { useRoute, useRouter } from "vue-router";
import { useDataStore } from "./store/data";
import { useUserStore } from "./store/user";
import { hydrateState } from "./store/data/hydrateState";
import {
  getAd4mClient,
  onAuthStateChanged,
} from "@perspect3vism/ad4m-connect/dist/utils.js";
import "@perspect3vism/ad4m-connect/dist/web.js";
import { EntryType } from "utils/types";
import subscribeToLinks from "utils/api/subscribeToLinks";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import semver from "semver";
import { dependencies } from "../package.json";
import Ad4mConnectUI from "@perspect3vism/ad4m-connect";

export default defineComponent({
  name: "App",
  setup() {
    const appStore = useAppStore();
    const router = useRouter();
    const route = useRoute();
    const componentKey = ref(0);
    const dataStore = useDataStore();
    const userStore = useUserStore();
    const watcherStarted = ref(false);
    const connect = ref();

    const ad4mConnect = ref(null);

    return {
      ad4mConnect,
      appStore,
      componentKey,
      router,
      route,
      dataStore,
      userStore,
      watcherStarted,
      connect,
    };
  },
  created() {
    this.appStore.changeCurrentTheme("global");
  },
  mounted() {
    const ui = Ad4mConnectUI({
      appName: "Flux",
      appDesc: "A Social Toolkit for the New Internet",
      appDomain: this.appDomain,
      appIconPath: "https://i.ibb.co/GnqjPJP/icon.png",
      capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
    });

    this.connect = ui;

    ui.addEventListener("authstatechange", async (e) => {
      if (ui.authState === "authenticated") {
        this.router.push("home");

        if (!this.watcherStarted) {
          this.startWatcher();
          this.watcherStarted = true;
          hydrateState();

          const client = await getAd4mClient();

          //Do version checking for ad4m / flux compatibility
          const { ad4mExecutorVersion } = await client.runtime.info();

          const isIncompatible = semver.gt(
            dependencies["@perspect3vism/ad4m"],
            ad4mExecutorVersion
          );

          if (isIncompatible) {
            this.$router.push({ name: "update-ad4m" });
          }
        }
      }
    });
  },
  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
    ui(): ApplicationState {
      return this.appStore.$state;
    },
    appDomain() {
      return window.location.origin;
    },
  },
  methods: {
    connectToAd4m() {
      this.connect.connect();
    },
    async startWatcher() {
      const client = await getAd4mClient();
      const watching: string[] = [];

      watch(
        this.dataStore.neighbourhoods,
        async (newValue) => {
          Object.entries(newValue).forEach(([perspectiveUuid]) => {
            const alreadyListening = watching.includes(perspectiveUuid);
            if (!alreadyListening) {
              watching.push(perspectiveUuid);
              subscribeToLinks({
                perspectiveUuid,
                added: async (link: LinkExpression) => {
                  if (link.data.predicate === EntryType.Message) {
                    try {
                      const routeChannelId = this.$route.params.channelId;
                      const channelId = link.data.source;
                      const isCurrentChannel = routeChannelId === channelId;

                      if (!isCurrentChannel) {
                        this.dataStore.setHasNewMessages({
                          communityId: perspectiveUuid,
                          channelId,
                          value: true,
                        });

                        const expression = Literal.fromUrl(
                          link.data.target
                        ).get();

                        const expressionDate = new Date(expression.timestamp);
                        let minuteAgo = new Date();
                        minuteAgo.setSeconds(minuteAgo.getSeconds() - 30);
                        if (expressionDate > minuteAgo) {
                          this.dataStore.showMessageNotification({
                            router: this.$router,
                            communityId: perspectiveUuid,
                            channelId,
                            authorDid: expression.author,
                            message: expression.data,
                            timestamp: expression.timestamp,
                          });
                        }
                      }
                    } catch (e: any) {
                      throw new Error(e);
                    }
                  }
                },
              });
            }
          });
        },
        { immediate: true, deep: true }
      );

      // @ts-ignore
      client!.perspective.addPerspectiveRemovedListener((perspective) => {
        const isCommunity = this.dataStore.getCommunity(perspective);
        if (isCommunity) {
          this.dataStore.removeCommunity({ communityId: perspective });
        }
      });
    },
  },
});
</script>

<style>
:root {
  --app-main-sidebar-width: 100px;
  --app-header-height: 60px;
}

@media (max-width: 800px) {
  :root {
    --app-main-sidebar-width: 75px;
    --j-font-base-size: 15px !important;
  }
}

html {
  height: 100%;
  width: 100%;
}

body {
  -webkit-font-smoothing: antialiased;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--app-main-sidebar-bg-color);
}

#app {
  height: 100%;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.global-modal {
  z-index: 999;
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
}

.global-modal__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.9;
  backdrop-filter: blur(15px);
}

.global-modal__content {
  position: relative;
}

.global-modal j-spinner {
  --j-spinner-size: 80px;
}
</style>
