<template>
  <div class="container">
    <j-text variant="heading-lg"> Trying to connect to ad4m</j-text>
    <j-text variant="body">
      Are you sure ad4m is downloaded and running?</j-text
    >
    <j-text variant="body">
      Download the latest version here. We will automatically detect when it is
      running, and you can use a completely decentralized version of Flux
    </j-text>
    <j-input :value="port" @change="(e) => (port = e.target.value)"></j-input>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { MainClient } from "@/app";
import { findAd4mPort } from "@/utils/findAd4minPort";

export default defineComponent({
  name: "ChannelView",
  components: {},
  data() {
    return {
      port: 12000,
    };
  },
  mounted() {
    this.startPortCheck();
  },
  methods: {
    async startPortCheck() {
      try {
        await findAd4mPort(this.port);
        this.$router.push({ name: "home" });
      } catch (e) {
        this.startPortCheck();
      }
    },
  },
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
