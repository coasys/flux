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
          <j-tab-item variant="button" value="theme-editor">
            <j-icon size="sm" name="eye" slot="start" />
            Apperance
          </j-tab-item>
          <j-tab-item variant="button" value="privacy">
            <j-icon size="sm" name="lock" slot="start" />
            Privacy
          </j-tab-item>
        </j-tabs>
      </aside>
      <div class="settings__content">
        <j-box pb="500">
          <j-toggle
            :checked="community.useLocalTheme"
            @change="(e) => setuseLocalTheme(e.target.checked)"
          >
            Use local theme
          </j-toggle>
        </j-box>
        <theme-editor
          v-if="showEditor"
          @update="updateCommunityTheme"
          :theme="community.theme"
        />
      </div>
    </div>
  </j-box>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { LocalCommunityState, ThemeState } from "@/store/types";
import { defineComponent } from "vue";
import ThemeEditor from "./ThemeEditor.vue";

export default defineComponent({
  components: { ThemeEditor },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    return {
      appStore,
      dataStore
    };
  },
  data() {
    return {
      currentView: "theme-editor",
    };
  },
  methods: {
    setuseLocalTheme(val: boolean) {
      console.log({ val });
      const id = this.$route.params.communityId as string;
      this.dataStore.setuseLocalTheme({ communityId: id, value: val });
      this.appStore.changeCurrentTheme(val ? id : "global");
    },
    updateCommunityTheme(val: ThemeState) {
      const id = this.$route.params.communityId as string;
      this.appStore.updateCommunityTheme({
        communityId: id,
        theme: { ...val },
      });
    },
  },
  computed: {
    showEditor(): boolean {
      return (
        this.currentView === "theme-editor" &&
        this.community.theme &&
        this.community.useLocalTheme
      );
    },
    community(): LocalCommunityState {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getCommunityState(id);
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
