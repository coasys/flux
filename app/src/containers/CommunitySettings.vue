<template>
  <j-box p="800">
    <j-box pb="800">
      <j-text variant="heading">Settings</j-text>
    </j-box>
    <div class="settings">
      <aside class="settings__sidebar">
        <j-tabs full :value="currentView" @change="(e: any) => (currentView = e.target.value)">
          <j-tab-item variant="button" value="theme-editor">
            <j-icon size="sm" name="eye" slot="start" />
            Apperance
          </j-tab-item>
        </j-tabs>
      </aside>
      <div class="settings__content">
        <!--
        <j-box pb="500">
          <j-toggle
            :checked="community.useLocalTheme"
            @change="(e: any) => setuseLocalTheme(e.target.checked)"
          >
            Use local theme
          </j-toggle>
        </j-box>
        <theme-editor
          v-if="showEditor"
          @update="updateCommunityTheme"
          :theme="community.theme"
        />
        -->
      </div>
    </div>
  </j-box>
</template>

<script setup lang="ts">
import { Theme, useThemeStore } from "@/stores";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const theme = useThemeStore();

const currentView = ref("theme-editor");

const showEditor = computed(() => currentView.value === "theme-editor");

function setuseLocalTheme(val: boolean) {
  const id = route.params.communityId as string;
  // TODO: Set local theme
  // this.dataStore.setuseLocalTheme({ communityId: id, value: val });
  theme.changeCurrentTheme(val ? id : "global");
}

function updateCommunityTheme(val: Theme) {
  const id = route.params.communityId as string;
  theme.updateCommunityTheme({
    communityId: id,
    theme: { ...val },
  });
}
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
