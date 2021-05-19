<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch } from "vue";
import {
  AD4M_SIGNAL,
  QUERY_EXPRESSION,
  LANGUAGE,
  ADD_LINK,
  PUB_KEY_FOR_LANG,
} from "./core/graphql_queries";
import { useStore } from "vuex";
import { ExpressionUIIcons } from "./store";
import ad4m from "@perspect3vism/ad4m-executor";
import { apolloClient } from "./main";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";

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
    //Query expression handler
    const getExpression = (url: string): Promise<ad4m.Expression> => {
      return new Promise((resolve) => {
        const getExpression = apolloClient.query<{
          expression: ad4m.Expression;
        }>({ query: QUERY_EXPRESSION, variables: { url: url } });
        getExpression.then((result) => {
          resolve(result.data.expression);
        });
      });
    };

    //Get language UI handler
    const getLanguage = (language: string): Promise<ad4m.Language> => {
      return new Promise((resolve) => {
        const getLanguage = apolloClient.query<{ language: ad4m.Language }>({
          query: LANGUAGE,
          variables: { address: language },
        });
        getLanguage.then((result) => {
          console.log("Got result", result);
          resolve(result.data.language);
        });
      });
    };

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
        language
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
            for (let i = 0; i < 10; i++) {
              console.log("Retrying get of expression signal");
              //@ts-ignore
              getExprRes = await getExpression(expression.data.target);
              if (getExprRes != null) {
                break;
              }
              await sleep(20);
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
              link: expression.data,
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
