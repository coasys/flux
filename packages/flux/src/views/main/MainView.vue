<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <router-view></router-view>
    <j-modal
      size="sm"
      :open="modals.showCreateCommunity"
      @toggle="(e: any) => setShowCreateCommunity(e.target.open)"
    >
      <create-community
        v-if="modals.showCreateCommunity"
        @submit="() => setShowCreateCommunity(false)"
        @cancel="() => setShowCreateCommunity(false)"
      />
    </j-modal>

    <j-modal
      :open="
        modals.showDisclaimer &&
        (modals.showWarningDisclaimer || showJoinCommunity)
      "
      @toggle="(e: any) => {
        setShowDisclaimer(e.target.open)
        setShowWarningDisclaimer(e.target.open)
      }"
    >
      <j-box p="800">
        <div v-if="modals.showWarningDisclaimer">
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
        <br v-if="modals.showWarningDisclaimer && showJoinCommunity" />
        <hr v-if="modals.showWarningDisclaimer && showJoinCommunity" />
        <br v-if="modals.showWarningDisclaimer && showJoinCommunity" />
        <j-box pb="500" v-if="showJoinCommunity">
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
import { mapActions } from "pinia";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import {
  COMMUNITY_TEST_VERSION,
  DEFAULT_TESTING_NEIGHBOURHOOD,
} from "utils/constants/general";

export default defineComponent({
  name: "MainAppView",
  setup() {
    return {
      isJoining: ref(false),
      appStore: useAppStore(),
      isInit: ref(false),
      showJoinCommunity: ref(false),
    };
  },
  components: {
    MainSidebar,
    AppLayout,
    CreateCommunity,
  },
  async created() {
    const client = await getAd4mClient();
    const existingPerspectives = await client.perspective.all();
    const defaultTestingCommunity = existingPerspectives.find(
      (p) => p.sharedUrl === DEFAULT_TESTING_NEIGHBOURHOOD
    );

    const appStore = this.appStore;
    //Check that user already has joined default testing community
    if (!defaultTestingCommunity) {
      // appStore.setShowDisclaimer(true);

      this.showJoinCommunity = true;
    }

    if (
      COMMUNITY_TEST_VERSION > appStore.seenCommunityTestVersion &&
      !defaultTestingCommunity
    ) {
      // appStore.setShowDisclaimer(true);
      this.showJoinCommunity = true;
    }
  },
  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowEditProfile",
      "setShowSettings",
      "setShowWarningDisclaimer",
      "setShowCreateCommunity",
      "setShowDisclaimer",
    ]),
    async joinTestingCommunity() {
      try {
        this.isJoining = true;
        await this.appStore.joinTestingCommunity();
      } catch (e) {
        console.log(e);
      } finally {
        this.isJoining = false;
      }
    },
  },
});
</script>
