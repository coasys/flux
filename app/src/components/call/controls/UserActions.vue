<template>
  <j-flex a="center" gap="500">
    <j-tooltip placement="top" title="Open app settings">
      <j-icon name="gear" color="ui-500" @click="goToSettings" />
    </j-tooltip>

    <j-tooltip
      v-if="inCall || route.params.channelId"
      placement="top"
      :title="`${callWindowOpen ? 'Hide' : 'Show'} call window`"
    >
      <j-icon :name="callWindowOpen ? 'arrows-angle-contract' : 'telephone'" color="ui-500" @click="toggleCallWindow" />
    </j-tooltip>
  </j-flex>
</template>

<script setup lang="ts">
import { useUiStore, useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { callWindowOpen } = storeToRefs(uiStore);
const { inCall } = storeToRefs(webrtcStore);

function goToSettings() {
  router.push({ name: "settings" });
}

function toggleCallWindow() {
  uiStore.setCallWindowOpen(!callWindowOpen.value);
}
</script>
