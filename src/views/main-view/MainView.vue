<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </app-layout>
</template>

<script lang="ts">
import AppLayout from "@/layout/AppLayout.vue";
import MainSidebar from "./main-sidebar/MainSidebar.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MainAppView",
  data() {
    return {
      isInit: false,
    };
  },
  components: {
    MainSidebar,
    AppLayout,
  },
});
</script>
