<template>
  <router-view />
  <j-toast
    :open="toast.open"
    autohide="10"
    @toggle="(e) => setToast({ open: e.target.open })"
    :variant="toast.variant"
  >
    {{ toast.message }}
  </j-toast>
  <j-modal
    :open="showErrorModal"
    @toggle="(e) => (showErrorModal = e.target.open)"
  >
    {{ errorMessage }}
  </j-modal>
</template>

<script lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { useRouter } from "vue-router";
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch, ref, computed } from "vue";
import { AD4M_SIGNAL } from "@/core/graphql_queries";
import { useStore } from "vuex";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";
import { expressionGetDelayMs, expressionGetRetries } from "@/core/juntoTypes";
import { getExpression } from "@/core/queries/getExpression";
import ad4m from "@perspect3vism/ad4m-executor";
import { AGENT_SERVICE_STATUS } from "@/core/graphql_queries";
import { ToastState } from "@/store";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const router = useRouter();
    const store = useStore();
    const errorMessage = ref("");
    const showErrorModal = ref(false);

    var language = "";
    var expression = {};

    onError((error) => {
      if (process.env.NODE_ENV !== "production") {
        // can use error.operation.operationName to single out a query type.
        logErrorMessages(error);

        errorMessage.value = JSON.stringify(error);
        showErrorModal.value = true;
      }
    });

    //Ad4m signal watcher
    const { result } = useSubscription(AD4M_SIGNAL);

    //Watch for agent unlock to set off running queries
    store.watch(
      (state) => state.agentUnlocked,
      async (newValue) => {
        console.log("agent unlocked changed to", newValue);
        if (newValue) {
          store.dispatch("loadExpressionLanguages");
        } else {
          router.push({ name: "signup" });
        }
      },
      { immediate: true }
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
          store.commit("addExpressionAndLinkFromLanguageAddress", {
            linkLanguage: language,
            //@ts-ignore
            link: expression,
            message: getExprRes,
          });
        }
      }
    });

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    return {
      toast: computed(() => store.state.ui.toast),
      setToast: (payload: ToastState) => store.commit("setToast", payload),
      showErrorModal,
      errorMessage,
    };
  },
  beforeCreate() {
    window.api.send("getLangPath");
    window.api.receive("getLangPathResponse", (data: string) => {
      console.log(`Received language path from main thread: ${data}`);
      this.$store.commit("setLanguagesPath", data);
    });
    const { onResult, onError } =
      useQuery<{
        agent: ad4m.AgentService;
      }>(AGENT_SERVICE_STATUS);
    onResult((val) => {
      const isInit = val.data.agent.isInitialized!;
      const isUnlocked = val.data.agent.isUnlocked!;
      console.log({ isInit, val, comment: "Hello" });
      this.$store.commit("updateAgentInitState", isInit);
      this.$store.commit("updateAgentLockState", isUnlocked);
      if (isInit == true) {
        //Get database perspective from store
        let databasePerspective = this.$store.getters.getDatabasePerspective;
        if (databasePerspective == "") {
          console.warn(
            "Does not have databasePerspective in store but has already been init'd! Add logic for getting databasePerspective as found with name"
          );
          //TODO: add the retrieval/state saving logic here
        }
      }
    });
    onError((error) => {
      console.log("WelcomeViewRight: AGENT_SERVICE_STATUS, error:", error);
    });
  },
});
</script>

<style>
body {
  padding: 0;
  margin: 0;
  color: var(--j-color-ui-500);
}

/* apply a natural box layout model to all elements, but allowing components to change */
html {
  box-sizing: border-box;
}
*,
*:before,
*:after {
  box-sizing: inherit;
}
</style>
