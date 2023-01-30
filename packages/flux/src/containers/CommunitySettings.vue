<template>
  <j-box p="800">
    <j-box pb="800">
      <j-text variant="heading">Settings</j-text>
    </j-box>
    <div class="settings">
      <aside class="settings__sidebar">
        <j-tabs
          full
          :value="currentView"
          @change="(e: any) => (currentView = e.target.value)"
        >
          <j-tab-item variant="button" value="theme-editor">
            <j-icon size="sm" name="eye" slot="start" />
            Apperance
          </j-tab-item>
        </j-tabs>
      </aside>
      <div class="settings__content">
        <j-box pb="500">
          <j-toggle
            name="local-theme-toggle"
            :checked="communityLocal.useLocalTheme"
            @change="(e: any) => setUseLocalTheme(e.target.checked)"
          >
            Use local theme
          </j-toggle>
        </j-box>
        <theme-editor
          v-if="showEditor"
          @update="updateCommunityTheme"
          :theme="communityLocal.theme"
        />
        <j-box pb="500">
          <j-toggle
            name="community-theme-toggle"
            :checked="communityLocal.useCommunityTheme"
            @change="(e: any) => setUseCommunityTheme(e.target.checked)"
          >
            Use community theme
          </j-toggle>
        </j-box>
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
import { CommunityState } from "@/store/types";
import ThemeModel from "utils/api/theme";

export default defineComponent({
  components: { ThemeEditor },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    return {
      appStore,
      dataStore,
    };
  },
  data() {
    return {
      currentView: "theme-editor",
    };
  },
  methods: {
    setUseLocalTheme(val: boolean) {
      const id = this.communityId;
      //this.dataStore.setUseCommunityTheme({ communityId: id, value: !val });
      this.dataStore.setUseLocalTheme({ communityId: id, value: val });
      this.appStore.changeCurrentTheme(val ? id : "global");
    },
    async setUseCommunityTheme(val: boolean) {
      const id = this.communityId;
      //this.dataStore.setUseLocalTheme({ communityId: id, value: !val });
      this.dataStore.setUseCommunityTheme({ communityId: id, value: val });

      const perspectiveUuid = this.communityLocal.perspectiveUuid;
      const Theme = new ThemeModel({ perspectiveUuid });
      const themes = await Theme.getAll();

      if (themes.length > 0) {
        const theme = themes[0];
        this.appStore.updateCommunityTheme({
          communityId: id,
          theme: { ...theme },
        });
      } else {
        this.appStore.showDangerToast({
          message: "Community theme is not set",
        });
      }
    },
    updateCommunityTheme(val: ThemeState) {
      const id = this.communityId;
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
        this.communityLocal.theme &&
        this.communityLocal.useLocalTheme
      );
    },
    communityLocal(): LocalCommunityState {
      const communityId = this.communityId;
      return this.dataStore.getLocalCommunityState(communityId);
    },
    communityId() {
      return this.$route.params.communityId as string;
    },
  },
});
</script>

<style scoped>
.settings {
  display: grid;
  gap: var(--j-space-1000);
  grid-template-columns: 1fr;
  overflow-y: auto;
}

@media (min-width: 800px) {
  .settings {
    grid-template-columns: 1fr 4fr;
  }
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
