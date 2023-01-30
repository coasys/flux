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
      v-if="modals.showLeaveCommunity && appStore.activeCommunity"
      size="sm"
      :open="modals.showLeaveCommunity"
      @toggle="(e) => setShowLeaveCommunity(e.target.open)"
    >
      <j-box p="800">
        <j-box pb="900">
          <j-text variant="heading">
            Leave community '{{
              dataStore.getCommunity(appStore.activeCommunity).name
            }}'
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
      v-if="modals.showDisclaimer && appStore.activeCommunity"
      :open="modals.showDisclaimer && appStore.activeCommunity"
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
import { defineComponent, ref } from "vue";

import CreateCommunity from "@/containers/CreateCommunity.vue";
import { ModalsState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { mapActions } from "pinia";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";

export default defineComponent({
  name: "MainAppView",
  setup() {
    return {
      dataStore: useDataStore(),
      isJoining: ref(false),
      appStore: useAppStore(),
      isInit: ref(false),
    };
  },
  components: {
    MainSidebar,
    AppLayout,
    CreateCommunity,
  },
  computed: {
    hasAlreadyJoinedTestingCommunity(): boolean {
      const community = this.dataStore.getCommunityByNeighbourhoodUrl(
        DEFAULT_TESTING_NEIGHBOURHOOD
      );
      return community ? true : false;
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
  },
});
</script>
