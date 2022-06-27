<template>
  <router-view :key="componentKey" v-if="!ui.showGlobalLoading"></router-view>
  <j-modal
    size="sm"
    :open="modals.showCode"
    @toggle="(e) => setShowCode(e.target.open)"
  >
    <connect-client
      @submit="capabilitiesCreated"
      @cancel="() => setShowCode(false)"
    />
  </j-modal>
  <div class="global-loading" v-if="ui.showGlobalLoading">
    <div class="global-loading__backdrop"></div>
    <div class="global-loading__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg"> </j-spinner>
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { MainClient } from "./app";
import { defineComponent, ref } from "vue";
import ConnectClient from "@/containers/ConnectClient.vue";
import { mapActions } from "pinia";
import { useAppStore } from "./store/app";
import { ApplicationState, ModalsState } from "@/store/types";
import { useRouter } from "vue-router";
import { checkConnection } from "./router";
import { findAd4mPort } from "./utils/findAd4minPort";

export default defineComponent({
  name: "App",
  components: { ConnectClient },

  setup() {
    const appStore = useAppStore();
    const router = useRouter();
    const componentKey = ref(0);
    return { 
      appStore, 
      componentKey, 
      router
    };
  },

  mounted() {
    this.appStore.setGlobalLoading(true);

    this.checkConnection();
  },

  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
    ui(): ApplicationState {
      return this.appStore.$state;
    },
  },

  methods: {
    ...mapActions(useAppStore, ["setShowCode"]),
    async capabilitiesCreated() {
      this.setShowCode(false);

      this.componentKey += 1;
    },
    async checkConnection() {
      const checkConnectionReroute = async () => {
        try {
          const status = await checkConnection();

          if (!status) {
            await findAd4mPort(MainClient.portSearchState === 'found' ? MainClient.port : undefined)
        
            await MainClient.ad4mClient.agent.status();
          }

          const { perspective } = await MainClient.ad4mClient.agent.me();
  
          const fluxLinksFound = perspective?.links.find(e => e.data.source.startsWith('flux://'));
  
          if (!fluxLinksFound) {
            await this.router.replace("/signup");
          } else {
            if (['unlock', 'connect', 'signup'].includes(this.router.currentRoute.value.name as string)) {
              await this.router.replace("/home");
            }
          }

          this.appStore.setGlobalLoading(false);
        } catch (e) {
          console.log('main', {e}, e.message === "signature verification failed");

          if (e.message.startsWith(
          "Capability is not matched, you have capabilities:"
          ) || e.message === 'signature verification failed') {
            MainClient.requestCapability(true).then((val) => {
              if (val) {
                this.setShowCode(true);
              }
            });
          } else if (e.message === "Cannot extractByTags from a ciphered wallet. You must unlock first."
          ) {
            await this.router.replace("/unlock");
            this.appStore.setGlobalLoading(false);
          } else if (e.message === "Couldn't find an open port") {
            await this.router.replace("/connect");
            this.appStore.setGlobalLoading(false);
          } else {
            await this.router.replace('/home');
            this.appStore.setGlobalLoading(false);
          }
        }
      }

      await checkConnectionReroute();

      setInterval(async () => {
        await checkConnectionReroute();
      }, 30000);
    }
  },
});
</script>

<style scoped>
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
  opacity: 0.8;
  backdrop-filter: blur(15px);
}

.global-loading__content {
  position: relative;
}

.global-loading j-spinner {
  --j-spinner-size: 80px;
}
</style>