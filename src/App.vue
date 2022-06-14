<template>
  <router-view :key="componentKey"></router-view>
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
</template>

<script lang="ts">
import { MainClient } from "./app";
import { defineComponent, ref } from "vue";
import ConnectClient from "@/containers/ConnectClient.vue";
import { mapActions } from "pinia";
import { useAppStore } from "./store/app";
import { ModalsState } from "@/store/types";

export default defineComponent({
  name: "App",
  components: { ConnectClient },

  setup() {
    const appStore = useAppStore();
    const componentKey = ref(0);
    return { appStore, componentKey };
  },

  mounted() {
    MainClient.requestCapability().then((val) => {
      if (val) {
        this.setShowCode(true);
      }
    });
  },

  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },

  methods: {
    ...mapActions(useAppStore, ["setShowCode"]),
    async capabilitiesCreated() {
      this.setShowCode(false);

      this.componentKey += 1;
    }
  },
});
</script>
