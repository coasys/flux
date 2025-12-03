<template>
  <j-modal
    :open="modalStore.showCommunitySettings"
    @toggle="(e: any) => (modalStore.showCommunitySettings = e.target.open)"
  >
    <j-box p="800">
      <j-box pb="800">
        <j-text variant="heading">Settings</j-text>
      </j-box>
      <div class="settings">
        <aside class="settings__sidebar">
          <j-tabs full :value="currentView" @change="(e: any) => (currentView = e.target.value)">
            <j-tab-item variant="button" value="theme-editor">
              <j-icon size="sm" name="eye" slot="start" />
              Appearance
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
  </j-modal>
</template>

<script setup lang="ts">
import { useRouteParams } from '@/composables/useRouteParams';
import { Theme, useModalStore, useThemeStore } from '@/stores';
import { computed, ref } from 'vue';

const modalStore = useModalStore();
const themeStore = useThemeStore();

const { communityId } = useRouteParams();

const currentView = ref('theme-editor');

const showEditor = computed(() => currentView.value === 'theme-editor');

function setuseLocalTheme(val: boolean) {
  // TODO: Set local theme
  // this.dataStore.setuseLocalTheme({ communityId: id, value: val });
  themeStore.changeCurrentTheme(val ? communityId.value : 'global');
}

function updateCommunityTheme(val: Theme) {
  themeStore.updateCommunityTheme({
    communityId: communityId.value,
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
