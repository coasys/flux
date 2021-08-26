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
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  methods: {
    cleanState() {
      window.api.send("cleanState");
    },
  },
});
</script>
