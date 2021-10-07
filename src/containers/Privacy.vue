<template>
  <j-box pb="800">
    <j-box pb="300">
      <j-text variant="label">Clear State</j-text>
    </j-box>
    <j-button size="md" variant="primary" @click="showConfirm = true">
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
  <j-modal :open="showConfirm" @toggle="(e) => (showConfirm = e.target.open)">
    <j-box p="800">
      <j-box py="500">
        <j-text variant="heading-sm">
          Are you sure you want to clear your state?
        </j-text>
        <j-text variant="body">
          This means you will loose all your communities and messages
        </j-text>
      </j-box>
      <j-box pt="500">
        <j-flex gap="300">
          <j-button @click="showConfirm = false">Cancel</j-button>
          <j-button variant="primary" @click="cleanState">
            Delete everything
          </j-button>
        </j-flex>
      </j-box>
    </j-box>
  </j-modal>
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
