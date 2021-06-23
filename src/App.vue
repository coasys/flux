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
  <div class="global-loading" v-if="ui.showGlobalLoading">
    <div class="global-loading__backdrop"></div>
    <div class="global-loading__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg"> </j-spinner>
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>
  <div class="global-error" v-if="globalError.show">
    <div class="global-error__backdrop"></div>
    <div class="global-error__content">
      <j-flex a="center" direction="column" gap="900">
        <j-text nomargin variant="heading-lg"
          >Whoops, something broke! 😅</j-text
        >
        <j-text nomargin v-if="globalError.message" variant="subheading">
          Please report this message to us:
        </j-text>
        <div class="global-error__message">
          {{ globalError.message }}
        </div>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { useRouter } from "vue-router";
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch, computed } from "vue";
import { AD4M_SIGNAL } from "@/core/graphql_queries";
import { useStore } from "vuex";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";
import { expressionGetDelayMs, expressionGetRetries } from "@/core/juntoTypes";
import { getExpressionAndRetry } from "@/core/queries/getExpression";
import ad4m from "@perspect3vism/ad4m-executor";
import { AGENT_SERVICE_STATUS } from "@/core/graphql_queries";
import { ModalsState, ToastState } from "@/store";
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

    onError((error) => {
      console.log("Got global graphql error, logging with error", error);
      if (process.env.NODE_ENV !== "production") {
        // can use error.operation.operationName to single out a query type.
        logErrorMessages(error);

        store.commit("showDangerToast", {
          message: JSON.stringify(error),
        });
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
      console.log("GOT INCOMING MESSAGE SIGNAL");
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
          console.log("FOUND EXPRESSION FOR SIGNAL");
          store.commit("addExpressionAndLinkFromLanguageAddress", {
            linkLanguage: language,
            link: link,
            message: getExprRes,
          });
          store.commit("setHasNewMessages", {
            channelId:
              store.getters.getChannelFromLinkLanguage(language).perspective,
            value: true,
          });
        }
      }
    });

    return {
      toast: computed(() => store.state.ui.toast),
      setToast: (payload: ToastState) => store.commit("setToast", payload),
    };
  },
  watch: {
    "ui.theme.hue": function (val) {
      console.log({ val });
      document.documentElement.style.setProperty("--j-color-primary-hue", val);
    },
    "ui.theme.name": {
      handler: function (themeName) {
        if (!themeName) {
          document.documentElement.setAttribute("theme", "");
        } else {
          import(`./themes/${themeName}.css`);
          document.documentElement.setAttribute("theme", themeName);
        }
      },
      immediate: true,
    },
    "ui.theme.fontFamily": function (val: "system" | "default") {
      const font = {
        default: `"Avenir", sans-serif`,
        monospace: `monospace`,
        system: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
      };
      document.documentElement.style.setProperty("--j-font-family", font[val]);
    },
  },
  computed: {
    ui() {
      return this.$store.state.ui;
    },
    globalError(): { show: boolean; message: string } {
      return this.$store.state.ui.globalError;
    },
    modals(): ModalsState {
      return this.$store.state.ui.modals;
    },
  },
  beforeCreate() {
    //Reset globalError & loading states in case application was exited with these states set to true before
    this.$store.commit("setGlobalError", {
      show: false,
      message: "",
    });
    this.$store.commit("setGlobalLoading", false);

    window.api.send("getLangPath");

    window.api.receive("getLangPathResponse", (data: string) => {
      // console.log(`Received language path from main thread: ${data}`);
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

    window.api.receive(
      "globalError",
      (payload: { show: boolean; message: string }) => {
        this.$store.commit("setGlobalError", payload);
      }
    );

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

:root {
  --app-main-sidebar-bg-color: hsl(var(--j-color-ui-hue), 0%, 100%);
  --app-main-sidebar-border-color: var(--j-border-color);
  --app-drawer-bg-color: hsl(var(--j-color-ui-hue), 0%, 100%);
  --app-drawer-border-color: var(--j-border-color);
  --app-channel-bg-color: var(--j-color-white);
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

.global-error {
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
  opacity: 0.8;
  backdrop-filter: blur(15px);
}

.global-loading__content {
  position: relative;
}

.global-error__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.8;
  backdrop-filter: blur(15px);
}

.global-error__content {
  text-align: center;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  padding-top: var(--j-space-600);
  padding-bottom: var(--j-space-600);
  color: var(--j-color-ui-300);
}

.global-error__message {
  text-align: left;
  background: var(--j-color-ui-800);
  padding: var(--j-space-500);
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 20px;
}

.global-loading j-spinner {
  --j-spinner-size: 80px;
}

.bug-icon::part(base) {
  width: 100px;
  height: 100px;
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
