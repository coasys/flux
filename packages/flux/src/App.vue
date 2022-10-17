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
  <ad4m-connect
    ref="ad4mConnect"
    appName="Flux"
    appDesc="Flux - A SOCIAL TOOLKIT FOR THE NEW INTERNET"
    appDomain="https://www.fluxsocial.io/"
    capabilities='[{"with":{"domain":"*","pointers":["*"]},"can": ["*"]}]'
    appiconpath="https://i.ibb.co/GnqjPJP/icon.png"
    openonshortcut
  ></ad4m-connect>
  <j-toast
    autohide="10"
    :variant="ui.toast.variant"
    :open="ui.toast.open"
    @toggle="(e) => appStore.setToast({ open: e.target.open })"
  >
    <j-text>{{ ui.toast.message }}</j-text>
  </j-toast>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { mapActions } from "pinia";
import { useAppStore } from "./store/app";
import {
  ApplicationState,
  ModalsState,
  NeighbourhoodState,
} from "@/store/types";
import { useRoute, useRouter } from "vue-router";
import { useDataStore } from "./store/data";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import {
  CHANNEL,
  FLUX_GROUP_DESCRIPTION,
  FLUX_GROUP_IMAGE,
  FLUX_GROUP_NAME,
  FLUX_GROUP_THUMBNAIL,
  MEMBER,
  DIRECTLY_SUCCEEDED_BY,
} from "utils/constants/communityPredicates";
import { useUserStore } from "./store/user";
import { buildCommunity, hydrateState } from "./store/data/hydrateState";
import { getGroupMetadata } from "./store/data/actions/fetchNeighbourhoodMetadata";
import {
  getAd4mClient,
  onAuthStateChanged,
} from "@perspect3vism/ad4m-connect/dist/utils";
import "@perspect3vism/ad4m-connect/dist/web";

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
    };
  },
  created() {
    this.appStore.changeCurrentTheme("global");
  },
  mounted() {
    onAuthStateChanged(async (event: string) => {
      console.log("event", event);
      if (event === "connected_with_capabilities") {
        if (!this.watcherStarted) {
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
  },
  methods: {
    connectToAd4m() {
      // @ts-ignore
      this.ad4mConnect?.connect();
    },
    async startWatcher() {
      const client = await getAd4mClient();
      const router = this.router;
      const route = this.route;
      const watching: string[] = [];

      //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
      const newLinkHandler = async (
        link: LinkExpression,
        perspective: string
      ) => {
        console.debug("GOT INCOMING DIRECTLY_SUCCEEDED_BY SIGNAL", link, perspective);
        if (link.data!.predicate! === DIRECTLY_SUCCEEDED_BY) {
          console.log("Got a new message signal");
          try {
            const channels = this.dataStore.getChannelStates(perspective);

            for (const channel of channels) {
              const isSameChannel = await client.perspective.queryProlog(
                perspective,
                `triple("${channel.id}", "${DIRECTLY_SUCCEEDED_BY}", "${link.data.target}").`
              );

              if (isSameChannel) {
                const expression = Literal.fromUrl(link.data.target).get();
                const expressionDate = new Date(expression.timestamp);
                let minuteAgo = new Date();
                minuteAgo.setSeconds(minuteAgo.getSeconds() - 30);
                if (expressionDate > minuteAgo) {
                  this.dataStore.showMessageNotification({
                    router,
                    route,
                    perspectiveUuid: perspective,
                    notificationChannelId: channel.id,
                    authorDid: (expression as any)!.author,
                    message: (expression as any).data,
                    timestamp: (expression as any).timestamp,
                  });
                }

                const { channelId } = this.$route.params;
                if (channelId !== channel.name) {
                  //Add UI notification on the channel to notify that there is a new message there
                  this.dataStore.setHasNewMessages({
                    communityId: perspective,
                    channelId: channel.name,
                    value: true,
                  });
                }
              }
            }
          } catch (e: any) {
            throw new Error(e);
          }
        } else if (link.data!.predicate! === MEMBER) {
          //If the link is a member, it's a new member in a community
          const did = link.data!.target!;
          const rawDid = did.includes("://") ? did.split("://")[1] : did;
          if (rawDid) {
            this.dataStore.setNeighbourhoodMember({
              member: rawDid,
              perspectiveUuid: perspective,
            });
          }
        } else if (
          link.data!.predicate! === CHANNEL &&
          link.author != this.userStore.getUser?.agent.did
        ) {
          //If the link is a channel, it's a new channel in a community
          console.log("Found a new channel via signal");

          try {
            const channel = link.data.target;
            const channelExpression = Literal.fromUrl(channel).get();

            this.dataStore.addChannel({
              communityId: perspective,
              channel: {
                id: channel,
                name: channelExpression.data,
                creatorDid: link.author,
                sourcePerspective: perspective,
                hasNewMessages: false,
                createdAt: link.timestamp,
                notifications: {
                  mute: false,
                },
              },
            });
            const channels = this.dataStore.getChannels.filter(
              (channel) => channel.sourcePerspective === perspective
            );
            if (channels.length === 1) {
              this.$router.push({
                name: "channel",
                params: {
                  communityId: perspective,
                  channelId: channelExpression.data,
                },
              });
            }
          } catch (e) {
            console.log("Error parsing channel link signal", e);
          }
        } else if (
          link.data!.predicate! === FLUX_GROUP_NAME ||
          link.data!.predicate! === FLUX_GROUP_DESCRIPTION ||
          link.data!.predicate! === FLUX_GROUP_IMAGE ||
          link.data!.predicate! === FLUX_GROUP_THUMBNAIL
        ) {
          //If the link has predicate which is for group metadata, it's a group metadata update
          console.log("Community update via link signal");

          const groupExp = await getGroupMetadata(perspective);

          this.dataStore.updateCommunityMetadata({
            communityId: perspective,
            name: groupExp?.name,
            description: groupExp?.description,
            image: groupExp?.image || "",
            thumbnail: groupExp?.thumbnail || "",
          });
        }
      };
      watch(
        this.dataStore.neighbourhoods,
        async (newValue: { [perspectiveUuid: string]: NeighbourhoodState }) => {
          for (const [k, v] of Object.entries(newValue)) {
            if (watching.filter((val) => val == k).length == 0) {
              console.log("Starting watcher on perspective", k);
              watching.push(k);
              const perspective = await client!.perspective.byUUID(k);

              if (perspective) {
                // @ts-ignore
                perspective.addListener("link-added", (result) => {
                  console.debug(
                    "Got new link with data",
                    result.data,
                    "and channel",
                    v
                  );
                  newLinkHandler(result, v.perspective.uuid);
                });
              }
            }
          }
        },
        { immediate: true, deep: true }
      );

      // @ts-ignore
      client!.perspective.addPerspectiveAddedListener(async (perspective) => {
        const proxy = await client!.perspective.byUUID(perspective.uuid);
        proxy!.addListener("link-added", (link) => {
          if (
            link.data!.predicate! === CHANNEL &&
            link.author != this.userStore.getUser?.agent.did
          ) {
            const channel = link.data.target;
            const channelExpression = Literal.fromUrl(channel).get();
            const channelName = channelExpression.name;
            if (channelName === "Home") {
              buildCommunity(proxy!).then((community) => {
                this.dataStore.addCommunity(community);

                this.dataStore.addChannel({
                  communityId: perspective.uuid,
                  channel: {
                    id: channel,
                    name: channelName,
                    creatorDid: link.author,
                    sourcePerspective: perspective.uuid,
                    hasNewMessages: false,
                    createdAt: link.timestamp,
                    notifications: {
                      mute: false,
                    },
                  },
                });
              });
            } else {
              this.dataStore.addChannel({
                communityId: perspective.uuid,
                channel: {
                  id: channel,
                  name: channelName,
                  creatorDid: link.author,
                  sourcePerspective: perspective.uuid,
                  hasNewMessages: false,
                  createdAt: link.timestamp,
                  notifications: {
                    mute: false,
                  },
                },
              });
            }
          }
        });
      });

      // @ts-ignore
      client!.perspective.addPerspectiveRemovedListener((perspective) => {
        const isCommunity = this.dataStore.getCommunity(perspective);
        if (isCommunity && isCommunity.neighbourhood) {
          this.dataStore.removeCommunity({ communityId: perspective });
        }
      });

      const allPerspectives = await client!.perspective.all();

      for (const perspective of allPerspectives) {
        perspective.addListener("link-added", (link) => {
          if (link.data!.predicate! === CHANNEL) {
            const channel = link.data.target;
            const channelExpression = Literal.fromUrl(channel).get();
            const channelName = channelExpression.name;
            if (channelName == "Home") {
              buildCommunity(perspective).then((community) => {
                this.dataStore.addCommunity(community);

                this.dataStore.addChannel({
                  communityId: perspective.uuid,
                  channel: {
                    id: channel,
                    name: channelName,
                    creatorDid: link.author,
                    sourcePerspective: perspective.uuid,
                    hasNewMessages: false,
                    createdAt: link.timestamp,
                    notifications: {
                      mute: false,
                    },
                  },
                });
              });
            }
          }
        });
      }
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
