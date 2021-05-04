<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription, useLazyQuery } from "@vue/apollo-composable";
import { defineComponent, watch, ref } from "vue";
import { AD4M_SIGNAL, QUERY_EXPRESSION } from "./core/graphql_queries";
import { useStore } from "vuex";

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
    const expressionUrl = ref("");
    const getExpression = useLazyQuery(QUERY_EXPRESSION, () => ({
      url: expressionUrl.value,
    }));
    var language = "";
    var expression = {};
    getExpression.onResult((result) => {
      store.commit({
        type: "addExpressionAndLinkFromLanguageAddress",
        value: {
          linkLanguage: language,
          link: expression,
          message: result.data.expression,
        },
      });
    });
    getExpression.onError((error) => {
      console.log("Got error in getExpression", error);
      //Show error dialogue
    });

    watch(result, (data) => {
      let signal = JSON.parse(data.signal.signal);
      language = data.signal.language;
      expression = signal.data.payload;
      console.log("SIGNAL RECEIVED IN UI: Coming from language", language);
      if (
        //@ts-ignore
        Object.prototype.hasOwnProperty.call(expression.data, "source") &&
        //@ts-ignore
        Object.prototype.hasOwnProperty.call(expression.data, "target") &&
        //@ts-ignore
        Object.prototype.hasOwnProperty.call(expression.data, "predicate")
      ) {
        //@ts-ignore
        if (expression.data.predicate == "sioc://content_of") {
          //@ts-ignore
          expressionUrl.value = expression.data.target;
          getExpression.load();
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
