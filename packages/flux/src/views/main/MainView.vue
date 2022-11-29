<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <router-view></router-view>
  </app-layout>

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
    :open="modals.showDisclaimer"
    @toggle="(e: any) => setShowDisclaimer(e.target.open)"
  >
    <j-box p="800">
      <j-box pb="500">
        <j-flex gap="400" a="center">
          <j-icon name="exclamation-diamond" size="xl" />
          <j-text nomargin variant="heading-lg">Disclaimer</j-text>
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
    </j-box>
  </j-modal>
</template>

<script lang="ts">
import AppLayout from "@/layout/AppLayout.vue";
import MainSidebar from "./main-sidebar/MainSidebar.vue";
import { defineComponent } from "vue";

import CreateCommunity from "@/containers/CreateCommunity.vue";
import { ModalsState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { mapActions } from "pinia";

export default defineComponent({
  name: "MainAppView",
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
  components: {
    MainSidebar,
    AppLayout,
    CreateCommunity,
  },
  data() {
    return {
      isInit: false,
    };
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
      "setShowCreateCommunity",
      "setShowDisclaimer",
    ]),
  },
});
</script>
