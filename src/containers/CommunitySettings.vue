<template>
  <j-box p="800">
    <j-box pl="500" pb="800">
      <j-text variant="heading">Settings</j-text>
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
            Theming
          </j-tab-item>
          <j-tab-item value="privacy">
            <j-icon size="sm" name="lock" slot="start" />
            Privacy
          </j-tab-item>
        </j-tabs>
      </aside>
      <div class="settings__content">
        <j-checkbox
          :checked="useGlobalTheme"
          @change="(e) => setUseGlobalTheme(e.target.checked)"
          >Use default theme</j-checkbox
        >
        <theme-editor
          v-if="currentView === 'theme-editor' && theme && !useGlobalTheme"
          @update="updateCommunityTheme"
          :theme="theme"
        />
      </div>
    </div>
  </j-box>
</template>

<script lang="ts">
import { ThemeState } from "@/store/types";
import { defineComponent } from "vue";
import ThemeEditor from "./ThemeEditor.vue";
import store from "@/store";

export default defineComponent({
  components: { ThemeEditor },
  data() {
    return {
      currentView: "theme-editor",
    };
  },
  methods: {
    setUseGlobalTheme(val: boolean) {
      const id = this.$route.params.communityId as string;
      store.commit.setUseGlobalTheme({ communityId: id, value: val });
      store.dispatch.changeCurrentTheme(val ? "global" : id);
    },
    updateCommunityTheme(val: ThemeState) {
      const id = this.$route.params.communityId as string;
      store.dispatch.updateCommunityTheme({
        communityId: id,
        theme: { ...val },
      });
    },
  },
  computed: {
    useGlobalTheme(): boolean {
      const id = this.$route.params.communityId as string;
      return store.getters.getCommunityState(id).useGlobalTheme;
    },
    theme(): ThemeState {
      const id = this.$route.params.communityId as string;
      return store.getters.getCommunityState(id).theme;
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
