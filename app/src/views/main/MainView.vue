<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <router-view></router-view>
    <j-modal
      size="sm"
      :open="modals.showCreateCommunity"
      @toggle="(e) => setShowCreateCommunity(e.target.open)"
    >
      <create-community
        v-if="modals.showCreateCommunity"
        @submit="() => setShowCreateCommunity(false)"
        @cancel="() => setShowCreateCommunity(false)"
      />
    </j-modal>

    <j-modal
      v-if="modals.showLeaveCommunity && activeCommunity"
      size="sm"
      :open="modals.showLeaveCommunity"
      @toggle="(e) => setShowLeaveCommunity(e.target.open)"
    >
      <j-box p="800">
        <j-box pb="900">
          <j-text variant="heading">
            Leave community '{{ activeCommunity.name || "Unknown" }}'
          </j-text>
          <j-text nomargin>
            Are you sure you want to leave this community?
          </j-text>
        </j-box>
        <j-flex j="end" gap="300">
          <j-button @click="() => setShowLeaveCommunity(false)" variant="link">
            Cancel
          </j-button>
          <j-button variant="primary" @click="leaveCommunity">
            Leave community
          </j-button>
        </j-flex>
      </j-box>
    </j-modal>

    <j-modal
      v-if="modals.showDisclaimer"
      :open="modals.showDisclaimer"
      @toggle="
        (e) => {
          setShowDisclaimer(e.target.open);
        }
      "
    >
      <j-box p="800">
        <div v-if="modals.showDisclaimer">
          <j-box pb="500">
            <j-flex gap="400" a="center">
              <j-icon name="exclamation-diamond" size="lg" />
              <j-text nomargin variant="heading">Disclaimer</j-text>
            </j-flex>
          </j-box>
          <j-text variant="ingress">
            This is an early version of Flux. Don't use this for essential
            communication.
          </j-text>
          <ul>
            <li>You might loose your communities and chat messages</li>
            <li>Messages might not always be delivered reliably</li>
          </ul>
        </div>
        <j-box pt="500" pb="500" v-if="!hasAlreadyJoinedTestingCommunity">
          <j-flex gap="400" a="center">
            <j-icon name="arrow-down-circle" size="lg" />
            <j-text nomargin variant="heading">Testing Community</j-text>
          </j-flex>
          <br />
          <j-text variant="ingress">
            Join the Flux Alpha testing community.
          </j-text>
          <j-button
            :loading="isJoining"
            variant="primary"
            @click="() => joinTestingCommunity()"
          >
            Join Official Testing Community
          </j-button>
        </j-box>
      </j-box>
    </j-modal>
  </app-layout>
</template>

<script lang="ts">
import AppLayout from "@/layout/AppLayout.vue";
import MainSidebar from "./main-sidebar/MainSidebar.vue";
import { defineComponent, ref, watch } from "vue";

import CreateCommunity from "@/containers/CreateCommunity.vue";
import { CommunityState, ModalsState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { mapActions } from "pinia";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { Community, EntryType } from "utils/types";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { hydrateState } from "@/store/data/hydrateState";
import semver from "semver";
import { dependencies } from "../../../package.json";
import { subscribeToLinks } from "utils/api";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";

export default defineComponent({
  name: "MainAppView",
  setup() {
    return {
      dataStore: useDataStore(),
      isJoining: ref(false),
      watcherStarted: ref(false),
      appStore: useAppStore(),
      isInit: ref(false),
    };
  },
  components: {
    MainSidebar,
    AppLayout,
    CreateCommunity,
  },
  async mounted() {
    if (!this.watcherStarted) {
      this.startWatcher();
    }

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
  },
  computed: {
    hasAlreadyJoinedTestingCommunity(): boolean {
      const community = this.dataStore.getCommunityByNeighbourhoodUrl(
        DEFAULT_TESTING_NEIGHBOURHOOD
      );
      return community ? true : false;
    },
    activeCommunity(): Community {
      const activeCommunity = this.appStore.activeCommunity;
      return this.dataStore.getCommunity(activeCommunity);
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowEditProfile",
      "setShowSettings",
      "setShowCreateCommunity",
      "setShowDisclaimer",
      "setShowLeaveCommunity",
    ]),
    leaveCommunity() {
      const activeCommunity = this.appStore.activeCommunity;

      this.$router.push({ name: "home" }).then(() => {
        this.dataStore
          .removeCommunity({ communityId: activeCommunity })
          .then(() => {
            this.appStore.setShowLeaveCommunity(false);
          });
      });
    },
    async joinTestingCommunity() {
      try {
        this.isJoining = true;
        await this.appStore.joinTestingCommunity();
        this.setShowDisclaimer(false);
      } catch (e) {
        console.log(e);
      } finally {
        this.isJoining = false;
      }
    },
    async startWatcher() {
      this.watcherStarted = true;
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
