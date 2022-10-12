<template>
  <j-box p="800">
    <j-box pl="500" pb="800">
      <j-text variant="heading-sm">Settings</j-text>
    </j-box>
    <div class="settings">
      <aside class="settings__sidebar">
        <j-tabs
          full
          vertical
          :value="currentView"
          @change="(e) => (currentView = e.target.value)"
        >
          <j-tab-item value="theme-editor">
            <j-icon size="sm" name="eye" slot="start" />
            Appearance
          </j-tab-item>
          <j-tab-item value="privacy">
            <j-icon size="sm" name="bell" slot="start" />
            Notifications
          </j-tab-item>
        </j-tabs>
      </aside>
      <div class="settings__content">
        <theme-editor
          v-if="currentView === 'theme-editor'"
          @update="updateGlobalTheme"
          :theme="theme"
        />
        <privacy v-if="currentView === 'privacy'" />
        <div v-if="currentView === 'updates'">
          <j-button @click="updateApp.func" variant="primary">{{
            updateApp.text
          }}</j-button>
        </div>
      </div>
    </div>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ThemeState } from "@/store/types";
import ThemeEditor from "./ThemeEditor.vue";
import Privacy from "./Privacy.vue";
import { useAppStore } from "@/store/app";

export default defineComponent({
  components: { ThemeEditor, Privacy },
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
  data() {
    return {
      currentView: "theme-editor",
    };
  },
  methods: {
    updateGlobalTheme(val: ThemeState) {
      this.appStore.updateGlobalTheme(val);
    },
  },
  computed: {
    theme(): ThemeState {
      return this.appStore.globalTheme;
    },
  },
});
</script>

<style scoped>
.settings {
  display: grid;
  gap: var(--j-space-1000);
  grid-template-columns: 1fr 4fr;
  overflow-y: auto;
}

.settings__sidebar {
  position: sticky;
  top: 0;
  left: 0;
}

.color-button {
  --hue: 0;
  --saturation: 80%;
  width: var(--j-size-md);
  height: var(--j-size-md);
  background-color: hsl(var(--hue), var(--saturation), 60%);
  border: 2px solid transparent;
  outline: 0;
  border-radius: var(--j-border-radius);
  margin-right: var(--j-space-200);
}
.color-button--active {
  border-color: var(--j-color-primary-600);
}
.colors {
  max-width: 400px;
}
</style>
