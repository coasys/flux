<template>
  <j-avatar
    :hash="did"
    :src="src"
    :initials="initials"
    :online="online"
    :slot="slot"
    :size="size"
  ></j-avatar>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    did: String,
    src: String,
    initials: String,
    online: Boolean,
    slot: String,
    size: { type: String, default: "md" },
  },
});
</script>

<style scoped>
j-avatar::part(base) {
  aspect-ratio: 1/1;
}
</style>
