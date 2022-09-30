<template>
  <j-box pb="800">
    <j-box pb="300">
      <j-text variant="label">Flux Privacy Policy</j-text>
    </j-box>
    <j-button size="md" variant="primary" @click="changeNotificationState">
      {{this.appStore.notification.globalNotification ? 'Disable' : 'Enable'}} Notifications
    </j-button>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useAppStore } from "@/store/app";

export default defineComponent({
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
      showConfirm: ref(false),
    };
  },
  methods: {
    changeNotificationState() {
      this.appStore.changeNotificationState(!this.appStore.notification.globalNotification);
    },
  },
});
</script>
