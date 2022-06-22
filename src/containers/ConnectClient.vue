<template>
  <j-box p="800">
    <j-flex direction="column" gap="500">
      <j-input
        :value="code"
        @keydown.enter="connectToClient"
        @input="(e) => (code = e.target.value)"
        size="lg"
        label="Secret code"
      ></j-input>

      <j-button
        :disabled="isConnecting || !code"
        :loading="isConnecting"
        @click="connectToClient"
        size="lg"
        full
        variant="primary"
      >
        Connect
      </j-button>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useDataStore } from "@/store/data";
import { MainClient } from "@/app";

export default defineComponent({
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      code: "",
      isConnecting: false,
    };
  },
  methods: {
    connectToClient() {
      this.isConnecting = true;

      MainClient.generateJwt(this.code)
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isConnecting = false;
        });
    },
  },
});
</script>

<style scoped>
.choice-button {
  --j-menu-item-height: auto;
  --j-menu-item-padding: var(--j-space-500) var(--j-space-600);
}
</style>
