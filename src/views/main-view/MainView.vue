<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <router-view></router-view>
  </app-layout>
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
    class="settings-modal"
    :open="modals.showSettings"
    @toggle="(e) => setShowSettings(e.target.open)"
  >
    <settings
      @submit="setShowEditSettings(false)"
      @cancel="setShowEditSettings(false)"
    />
  </j-modal>
</template>

<script lang="ts">
import AppLayout from "@/layout/AppLayout.vue";
import MainSidebar from "./main-sidebar/MainSidebar.vue";
import { defineComponent } from "vue";

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
    ...mapMutations(["setShowEditProfile", "setShowSettings"]),
  },
});
</script>
