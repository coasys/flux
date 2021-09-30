<template>
  <j-box pb="800">
    <j-box pb="300">
      <j-text variant="label">Clear State</j-text>
    </j-box>
    <j-button size="md" variant="primary" @click="cleanState">
      <j-icon size="sm" name="trash"></j-icon>
      Clear state
    </j-button>
  </j-box>
  <j-box pb="300">
    <j-text variant="label">Get logs</j-text>
  </j-box>
  <j-button size="md" variant="primary" @click="getLogs">
    <j-icon size="sm" name="clipboard"></j-icon>
    Get logs
  </j-button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useAppStore } from "@/store/app";

export default defineComponent({
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
  methods: {
    cleanState() {
      window.api.send("cleanState");
    },
    getLogs() {
      window.api.send("copyLogs");
      this.appStore.showSuccessToast({
        message:
          "Log file called debug.log been copied to your desktop, please upload to Junto Discord, thanks <3",
      });
    },
  },
});
</script>
