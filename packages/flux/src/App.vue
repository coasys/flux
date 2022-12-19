<template>
  <router-view :key="componentKey" @connectToAd4m="connectToAd4m"></router-view>
  <div class="global-loading" v-if="ui.showGlobalLoading">
    <div class="global-loading__backdrop"></div>
    <div class="global-loading__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg"> </j-spinner>
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>
  <div class="global-loading" v-if="ui.globalError.show">
    <div class="global-loading__backdrop"></div>
    <div class="global-loading__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-text size="700">{{ui.globalError.message}}</j-text>
      </j-flex>
    </div>
  </div>
  <ad4m-connect
    theme="dark"
    ref="ad4mConnect"
    appName="Flux"
    appDesc="A Social Toolkit for the New Internet"
    :appDomain="appDomain"
    capabilities='[{"with":{"domain":"*","pointers":["*"]},"can": ["*"]}]'
    appiconpath="https://i.ibb.co/GnqjPJP/icon.png"
    openonshortcut
  ></ad4m-connect>
  <j-toast
    autohide="10"
    :variant="ui.toast.variant"
    :open="ui.toast.open"
    @toggle="(e: any) => appStore.setToast({ open: e.target.open })"
  >
    <j-text>{{ ui.toast.message }}</j-text>
  </j-toast>
  <j-modal :open="showPrompt">
    <header slot="header">
      <j-text variant="heading">Join the default Flux Alpha Community</j-text>
      <j-button @click="joinTestingCommunity()">
        Join
      </j-button>
    </header>
  </j-modal>
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
} from "@perspect3vism/ad4m-connect/dist/utils";
import "@perspect3vism/ad4m-connect/dist/web.js";
import { EntryType } from "utils/types";
import subscribeToLinks from "utils/api/subscribeToLinks";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import semver from "semver";
import { EXPECTED_AD4M_VERSION, COMMUNITY_TEST_VERSION, DEFAULT_TESTING_NEIGHBOURHOOD } from "utils/constants/general";

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
    const showPrompt = ref(false);

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
      showPrompt
    };
  },
  created() {
    this.appStore.changeCurrentTheme("global");
  },
  mounted() {
    onAuthStateChanged(async (event: string) => {
      if (event === "connected_with_capabilities") {
        if (!this.watcherStarted) {
          const client = await getAd4mClient();

          //Do version checking for ad4m / flux compatibility
          const version = (await client.runtime.info()).ad4mExecutorVersion;
          console.log("Running AD4M version:", version);
          if (semver.gt(EXPECTED_AD4M_VERSION, version)) {
            console.error("AD4M version is not supported");
            this.appStore.setGlobalError({
              show: true,
              message: "AD4M version is not supported",
            });
          } else {
            this.appStore.setGlobalError({
              show: false,
              message: "",
            });
          }

          //Check that user already has joined default testing community, if not then show prompt allowing user to join
          //With a button click
          if (!this.appStore.hasShownDefaultJoinPrompt) {
            this.appStore.hasShownDefaultJoinPrompt = true;
            this.showPrompt = true;
          }

          if (COMMUNITY_TEST_VERSION > this.appStore.seenCommunityTestVersion) {
            this.showPrompt = true;
          }

          this.startWatcher();
          this.watcherStarted = true;
          hydrateState();
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
    async joinTestingCommunity() {
      const client = await getAd4mClient();
      const existingPerspectives = await client.perspective.all();
      if (
        existingPerspectives
          .filter(perspective => perspective.neighbourhood!.linkLanguage === DEFAULT_TESTING_NEIGHBOURHOOD)
      ) {
        console.warn("This user has already joined the testing community... aborting");
        return;
      } 

      await client.neighbourhood.joinFromUrl(DEFAULT_TESTING_NEIGHBOURHOOD);
      this.appStore.seenCommunityTestVersion = COMMUNITY_TEST_VERSION;
      this.appStore.hasShownDefaultJoinPrompt = true;
    },
    connectToAd4m() {
      // @ts-ignore
      this.ad4mConnect?.connect();
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
  overflow: hidden;
}

#app {
  height: 100%;
  width: 100%;
  -webkit-overflow-scrolling: touch;
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

.global-loading j-spinner {
  --j-spinner-size: 80px;
}
</style>
