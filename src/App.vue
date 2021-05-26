<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch } from "vue";
import { AD4M_SIGNAL } from "@/core/graphql_queries";
import { useStore } from "vuex";
import { ExpressionUIIcons } from "@/store";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";
import { expressionGetDelayMs, expressionGetRetries } from "@/core/juntoTypes";
import { getExpression } from "@/core/queries/getExpression";
import { getLanguage } from "@/core/queries/getLanguage";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const store = useStore();
    var language = "";
    var expression = {};

    onError((error) => {
      if (process.env.NODE_ENV !== "production") {
        // can use error.operation.operationName to single out a query type.
        logErrorMessages(error);
      }
    });

    //Ad4m signal watcher
    const { result } = useSubscription(AD4M_SIGNAL);

    //Watch for agent unlock to set off running queries
    store.watch(
      (state) => state.agentUnlocked,
      async (newValue) => {
        if (newValue.value == true) {
          //TODO: this is probably not needed here and should work fine on join/create of community
          let expressionLangs =
            store.getters.getAllExpressionLanguagesNotLoaded;
          for (const [, lang] of expressionLangs.entries()) {
            let language = await getLanguage(lang);
            console.log("Got language", language);
            if (language != null) {
              let uiData: ExpressionUIIcons = {
                languageAddress: language!.address!,
                createIcon: language!.constructorIcon!.code!,
                viewIcon: language!.iconFor!.code!,
              };
              store.commit({
                type: "addExpressionUI",
                value: uiData,
              });
            }
            await sleep(50);
          }
        }
      }
    );

    //Watch for incoming signals to get expression data
    watch(result, async (data) => {
      let signal = JSON.parse(data.signal.signal);
      language = data.signal.language;
      expression = signal.data.payload;
      console.log(
        new Date().toISOString(),
        "SIGNAL RECEIVED IN UI: Coming from language",
        language,
        signal
      );
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
          let getExprRes = await getExpression(expression.data.target);
          if (getExprRes == null) {
            for (let i = 0; i < expressionGetRetries; i++) {
              console.log("Retrying get of expression signal");
              //@ts-ignore
              getExprRes = await getExpression(expression.data.target);
              if (getExprRes != null) {
                break;
              }
              await sleep(expressionGetDelayMs);
            }
            if (getExprRes == null) {
              throw Error("Could not get expression from link signal");
            }
          }
          console.log(
            new Date().toISOString(),
            "Got expression result back",
            getExprRes
          );
          store.commit({
            type: "addExpressionAndLinkFromLanguageAddress",
            value: {
              linkLanguage: language,
              //@ts-ignore
              link: expression,
              message: getExprRes,
            },
          });
        }
      }
    });

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

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
