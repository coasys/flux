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
import { useRoute, useRouter } from "vue-router";
import { useSubscription } from "@vue/apollo-composable";
import { defineComponent, watch, computed } from "vue";
import { AD4M_SIGNAL } from "@/core/graphql_queries";
import { useStore } from "vuex";
import { onError } from "@apollo/client/link/error";
import { logErrorMessages } from "@vue/apollo-util";
import { expressionGetDelayMs, expressionGetRetries } from "@/core/juntoTypes";
import ad4m from "@perspect3vism/ad4m-executor";
import { AGENT_SERVICE_STATUS, QUERY_EXPRESSION } from "@/core/graphql_queries";
import { ModalsState, ToastState } from "@/store";
import parseSignalAsLink from "@/core/utils/parseSignalAsLink";
import showMessageNotification from "@/utils/showMessageNotification";
import { print } from "graphql/language/printer";

declare global {
  interface Window {
    api: any;
  }
}

export default defineComponent({
  name: "App",
  setup() {
    const router = useRouter();
    const route = useRoute();
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
          store.commit("updateApplicationStartTime", new Date());
          store
            .dispatch("loadExpressionLanguages")
            .catch((e) => console.log(e));
        } else {
          router.push({ name: "signup" });
        }
      },
      { immediate: true }
    );

    //Watch for incoming signals from holochain - an incoming signal should mean a DM is inbound
    watch(result, async (data) => {
      console.log("GOT INCOMING MESSAGE SIGNAL");
      //Parse out the signal data to its link form and validate the link structure
      const linkData = parseSignalAsLink(data.signal);
      if (linkData) {
        const link = linkData.link;
        const language = linkData.language;
        if (link.data!.predicate! == "sioc://content_of") {
          //Start expression web worker to try and get the expression data pointed to in link target
          const expressionWorker = new Worker("pollingWorker.js");

          expressionWorker.postMessage({
            retry: expressionGetRetries,
            interval: expressionGetDelayMs,
            query: print(QUERY_EXPRESSION),
            variables: { url: link.data!.target! },
            name: "Expression signal get",
          });

          expressionWorker.onerror = function (e) {
            throw new Error(e.toString());
          };

          expressionWorker.addEventListener("message", (e) => {
            const expression = e.data.expression;
            if (expression) {
              //Expression is not null, which means we got the data and we can terminate the loop
              expressionWorker.terminate();
              const message = JSON.parse(expression!.data!);
              const escapedMessage = message.body.replace(
                /(\s*<.*?>\s*)+/g,
                " "
              );
              console.log("FOUND EXPRESSION FOR SIGNAL");
              //Add the expression to the store
              store.commit("addExpressionAndLinkFromLanguageAddress", {
                linkLanguage: language,
                link: link,
                message: expression,
              });

              showMessageNotification(
                router,
                route,
                store,
                language,
                expression!.author!.did!,
                escapedMessage
              );

              //Add UI notification on the channel to notify that there is a new message there
              store.commit("setHasNewMessages", {
                channelId:
                  store.getters.getChannelFromLinkLanguage(language)
                    .perspective,
                value: true,
              });
            }
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
    "ui.theme.hue": {
      handler: function (hue) {
        document.documentElement.style.setProperty(
          "--j-color-primary-hue",
          hue
        );
      },
      immediate: true,
    },
    "ui.theme.saturation": {
      handler: function (saturation) {
        document.documentElement.style.setProperty(
          "--j-color-saturation",
          saturation + "%"
        );
      },
      immediate: true,
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
    "ui.theme.fontFamily": {
      handler: function (fontFamily: string) {
        const font = {
          default: `"Avenir", sans-serif`,
          monospace: `monospace`,
          system: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
        };
        document.documentElement.style.setProperty(
          "--j-font-family",
          // @ts-ignore
          font[fontFamily]
        );
      },
      immediate: true,
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

    window.api.receive("windowState", (data: string) => {
      console.log(`setWindowState: ${data}`);
      this.$store.commit("setWindowState", data);
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

    const { onResult, onError } = useQuery<{
      agent: ad4m.AgentService;
    }>(AGENT_SERVICE_STATUS);
    onResult((val) => {
      const isInit = val.data.agent.isInitialized!;
      const isUnlocked = val.data.agent.isUnlocked!;
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
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  padding: 0;
  margin: 0;
  color: var(--j-color-ui-500);
}

/* TODO: Put this in junto-elements? */
j-popover {
  position: fixed !important;
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

* {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --app-main-sidebar-bg-color: hsl(var(--j-color-ui-hue), 0%, 100%);
  --app-main-sidebar-border-color: var(--j-border-color);
  --app-drawer-bg-color: hsl(var(--j-color-ui-hue), 0%, 100%);
  --app-drawer-border-color: var(--j-border-color);
  --app-channel-bg-color: var(--j-color-white);
  --app-channel-border-color: var(--j-border-color);
  --app-channel-header-bg-color: var(--j-color-white);
  --app-channel-footer-bg-color: var(--j-color-white);
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
