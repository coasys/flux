<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch } from "vue";
import { AD4M_SIGNAL } from "./core/graphql_queries";
import { useStore } from "vuex";
import Expression from "@perspect3vism/ad4m/Expression";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const store = useStore();
    const { result } = useSubscription(AD4M_SIGNAL);

    watch(result, (data) => {
      console.log("\n\nSIGNAL RECEIVED IN UI:", JSON.parse(data.signal.signal));
      console.log("Coming from language", data.signal.language);
      let expression = data.signal.signal.data.payload;
      console.log("Parse as exp", expression);
      if (Object.prototype.hasOwnProperty.call(expression.data, "source") 
        && Object.prototype.hasOwnProperty.call(expression.data, "target") 
          && Object.prototype.hasOwnProperty.call(expression.data, "predicate")) {
        //@ts-ignore
        if (expression.data.predicate == "sioc://content_of") {
          store.commit({
            type: "pushLinkExpression",
            value: [data.signal.language, expression],
          });
        }
      }
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
