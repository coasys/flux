<template>
  <router-view />
</template>

<script lang="ts">
import { useSubscription, useLazyQuery, useMutation } from "@vue/apollo-composable";
import { defineComponent, watch, ref } from "vue";
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

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const store = useStore();
    const expressionUrl = ref("");
    const languageAddress = ref("");
    const currentQueryLang = ref("");
    const perspectiveUuid = ref("");
    const linkData = ref({});
    var language = "";
    var expression = {};

    //Ad4m signal watcher
    const { result } = useSubscription(AD4M_SIGNAL);
    //Query expression handke
    const getExpression = useLazyQuery(QUERY_EXPRESSION, () => ({
      url: expressionUrl.value,
    }));
    //Get language UI handler
    const getLanguage = useLazyQuery(LANGUAGE, () => ({
      address: languageAddress.value,
    }));

    //When we got an expression add it tot he currently defined language
    //NOTE: this might break when there are lots of messages coming in at once from different languages
    getExpression.onResult((result) => {
      console.log(
        new Date().toISOString(),
        "Got expression result back",
        result
      );
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

    let resultPromise = new Promise((resolve, reject) => {
      getLanguage.onResult((result) => {
        console.log(result);
        let uiData: ExpressionUIIcons = {
          languageAddress: languageAddress.value,
          createIcon: result.data.language.constructorIcon.code,
          viewIcon: result.data.language.iconFor.code,
        };
        store.commit({
          type: "addExpressionUI",
          value: uiData,
        });
        resolve("");
      });
      getLanguage.onError((error) => {
        reject(error);
      });
    });

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    }

    const pubKeyForLang = useLazyQuery<{
      pubKeyForLanguage: string;
    }>(PUB_KEY_FOR_LANG, () => {
      return { lang: currentQueryLang.value };
    });

    const { mutate: addLink, error: addLinkError } = useMutation<{
      addLink: ad4m.LinkExpression;
    }>(ADD_LINK, () => {
      return {
      variables: {
        perspectiveUUID: perspectiveUuid.value,
        link: JSON.stringify(linkData.value),
      },
    }});

    function createLink(link: ad4m.Link): Promise<ad4m.LinkExpression> {
      linkData.value = link;
      return new Promise((resolve, reject) => {
        addLink().then((addLinkResp) => {
          resolve(addLinkResp.data!.addLink);
        });
      });
    }

    function getPubKeyForLang(lang: string): Promise<string> {
      currentQueryLang.value = lang;
      return new Promise((resolve, reject) => {
        pubKeyForLang.onResult((result) => {
          resolve(result.data.pubKeyForLanguage);
        });
        pubKeyForLang.onError((error) => {
          reject(error);
        });
        pubKeyForLang.load();
      });
    }

    async function setActiveAgents() {
      const communities = store.getters.getCommunities;

      for (const community of communities) {
        const channels = community.value.channels;
        
        for (const channel of channels) {
          perspectiveUuid.value = channel.perspective;

          let channelScPubKey = await getPubKeyForLang(channel.linkLanguageAddress);

          noDelaySetInterval(async () => {
            let addActiveAgentLink = await createLink({
              source: "active_agent",
              target: channelScPubKey,
              predicate: "*",
            });

            console.log("Created active agent link with result", addActiveAgentLink);
          }, 600000);
        }
      }
    }

    store.watch(
      (state) => state.agentUnlocked,
      async (newValue) => {
        if (newValue.value == true) {
          //TODO: these are the kind of operations that are best done in a loading screen
          store.commit({
            type: "updateApplicationStartTime",
            value: new Date(),
          });
          
          let expressionLangs =
            store.getters.getAllExpressionLanguagesNotLoaded;

          await setActiveAgents();

          for (const [, lang] of expressionLangs.entries()) {
            console.log("App.vue: Fetching UI lang:", lang);
            languageAddress.value = lang;
            getLanguage.load();
            await sleep(40);
            await resultPromise;
          }
        }
      }
    );

    watch(result, (data) => {
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
