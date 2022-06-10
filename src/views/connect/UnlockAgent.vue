<template>
  <div class="container">
    <j-text variant="heading-lg">You agent is locked</j-text>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "UnlockAgent",
  components: {},
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
