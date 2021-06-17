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
  <div class="global-loading" v-if="isGlobalLoading">
    <div class="global-loading__backdrop"></div>
    <j-flex a="center" direction="column" gap="1000">
      <j-spinner size="lg"> </j-spinner>
      <j-text size="700">Please wait...</j-text>
    </j-flex>
  </div>
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
import { getExpressionAndRetry } from "@/core/queries/getExpression";
import ad4m from "@perspect3vism/ad4m-executor";
import { AGENT_SERVICE_STATUS } from "@/core/graphql_queries";
import { ToastState } from "@/store";
import parseSignalAsLink from "@/core/utils/parseSignalAsLink";

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

    onError((error) => {
      if (process.env.NODE_ENV !== "production") {
        // can use error.operation.operationName to single out a query type.
        logErrorMessages(error);

        errorMessage.value = JSON.stringify(error);
        showErrorModal.value = true;
      }
    });

    //Ad4m signal watcher
    const { result } = useSubscription<{ signal: ad4m.Signal }>(AD4M_SIGNAL);

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
      const linkData = parseSignalAsLink(data.signal);
      if (linkData) {
        const link = linkData.link;
        const language = linkData.language;
        if (link.data!.predicate! == "sioc://content_of") {
          let getExprRes = await getExpressionAndRetry(
            link.data!.target!,
            expressionGetRetries,
            expressionGetDelayMs
          );
          store.commit("addExpressionAndLinkFromLanguageAddress", {
            linkLanguage: language,
            //@ts-ignore
            link: link,
            message: getExprRes,
          });
        }
      }
    });

    return {
      toast: computed(() => store.state.ui.toast),
      setToast: (payload: ToastState) => store.commit("setToast", payload),
      showErrorModal,
      errorMessage,
    };
  },
  computed: {
    isGlobalLoading() {
      return this.$store.state.ui.isGlobalLoading;
    },
  },
  beforeCreate() {
    window.api.send("getLangPath");

    window.api.receive("getLangPathResponse", (data: string) => {
      console.log(`Received language path from main thread: ${data}`);
      this.$store.commit("setLanguagesPath", data);
    });

    window.api.receive("update_available", () => {
      this.$store.commit("updateUpdateState", { updateState: "available" });
    });

    window.api.receive("update_not_available", () => {
      this.$store.commit("updateUpdateState", { updateState: "not-available" });
    });

    window.api.receive("update_downloaded", () => {
      this.$store.commit("updateUpdateState", { updateState: "downloaded" });
    });

    window.api.receive("download_progress", (data: any) => {
      this.$store.commit("updateUpdateState", { updateState: "downloading" });
    });

    window.api.receive("setGlobalLoading", (val: boolean) => {
      this.$store.commit("setGlobalLoading", val);
    });

    const { onResult, onError } =
      useQuery<{
        agent: ad4m.AgentService;
      }>(AGENT_SERVICE_STATUS);
    onResult((val) => {
      const isInit = val.data.agent.isInitialized!;
      const isUnlocked = val.data.agent.isUnlocked!;
      this.$store.commit("updateAgentInitState", isInit);
      this.$store.commit("updateAgentLockState", isUnlocked);
      if (isUnlocked == true) {
        this.$store.commit("updateApplicationStartTime", new Date());
      }
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

.global-loading {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
}

.global-loading__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.5;
  backdrop-filter: blur(15px);
}

.global-loading j-spinner {
  --j-spinner-size: 80px;
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
