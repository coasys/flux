<template>
  <div class="container">
    <j-text variant="heading-lg"> Trying to connect to ad4m</j-text>
    <j-text variant="body">
      Are you sure ad4m is downloaded and running?</j-text
    >
    <j-text variant="body">
      Download the latest version <a target="_blank" href="https://github.com/perspect3vism/ad4min/releases/latest">here</a>. We will automatically detect when it is
      running, and you can use a completely decentralized version of Flux, if it doesn't connect automatically refresh the page.
    </j-text>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ChannelView",
  components: {},
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
