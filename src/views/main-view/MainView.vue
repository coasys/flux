<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <router-view></router-view>
  </app-layout>

  <j-modal
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
    :open="modals.showEditProfile"
    @toggle="(e) => setShowEditProfile(e.target.open)"
  >
    <edit-profile
      @submit="() => setShowEditProfile(false)"
      @cancel="() => setShowEditProfile(false)"
    />
  </j-modal>

  <j-modal
    size="lg"
    :open="modals.showSettings"
    @toggle="(e) => setShowSettings(e.target.open)"
  >
    <settings
      @submit="setShowSettings(false)"
      @cancel="setShowSettings(false)"
    />
  </j-modal>
</template>

<script lang="ts">
import AppLayout from "@/layout/AppLayout.vue";
import MainSidebar from "./main-sidebar/MainSidebar.vue";
import { defineComponent } from "vue";

import CreateCommunity from "@/containers/CreateCommunity.vue";
import EditProfile from "@/containers/EditProfile.vue";
import Settings from "@/containers/Settings.vue";
import { mapMutations } from "vuex";
import { ModalsState } from "@/store";

export default defineComponent({
  name: "MainAppView",
  components: {
    MainSidebar,
    AppLayout,
    EditProfile,
    Settings,
    CreateCommunity,
  },
  data() {
    return {
      isInit: false,
    };
  },
  computed: {
    modals(): ModalsState {
      return this.$store.state.ui.modals;
    },
  },
  methods: {
    ...mapMutations([
      "setShowEditProfile",
      "setShowSettings",
      "setShowCreateCommunity",
    ]),
  },
});
</script>
