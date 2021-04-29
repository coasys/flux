<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch } from "vue";
import { AD4M_SIGNAL } from "./core/graphql_queries";

export default defineComponent({
  name: "App",
  setup() {
    const { result } = useSubscription(AD4M_SIGNAL);
    watch(result, (data) => {
      console.log("\n\nSIGNAL RECEIVED IN UI:", data);
    });

    return {};
  },
  beforeCreate() {
    window.api.send("getLangPath");
    window.api.receive("getLangPathResponse", (data: string) => {
      console.log(`Received language path from main thread: ${data}`);
      this.$store.commit({
        type: "setLanguagesPath",
        value: data,
      });
    });
  },
});
</script>

<style lang="scss">
@import "src/assets/sass/main.scss";
</style>
