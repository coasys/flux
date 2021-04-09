<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import { AGENT_SERVICE_STATUS } from "../core/graphql_queries";
import { useQuery, useResult, useMutation } from "@vue/apollo-composable";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "Home",
  components: {
    HelloWorld,
  },
  mounted() {
    console.log(window);
    window.api.send("ping");
    window.api.receive("pong", (data: any) => {
      console.log(`Received pong: ${data}`);
    });

    const { result, loading, error } = useQuery(AGENT_SERVICE_STATUS);
    console.log(result);
  },
});
</script>
