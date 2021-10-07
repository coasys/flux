<template>
  <sidebar-layout>
    <template v-slot:sidebar>My profile</template>
    <router-view :key="$route.fullPath"></router-view>
  </sidebar-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ProfileView",
});
</script>
