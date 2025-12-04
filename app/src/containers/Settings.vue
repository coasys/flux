<template>
  <div class="wrapper">
    <j-icon class="sidebar-button" name="layout-sidebar" @click="uiStore.toggleAppSidebar" />
    <j-box pt="800" pb="400">
      <j-text variant="heading">Settings</j-text>
    </j-box>
    <div class="settings">
      <aside class="sidebar">
        <j-tabs full :value="currentView" @change="(e: any) => (currentView = e.target.value)">
          <j-tab-item value="theme-editor">
            <j-icon size="sm" name="eye" slot="start" />
            Appearance
          </j-tab-item>
          <j-tab-item value="privacy">
            <j-icon size="sm" name="bell" slot="start" />
            Notifications
          </j-tab-item>
        </j-tabs>
        <div>
          <ThemeEditor v-if="currentView === 'theme-editor'" />
          <Privacy v-if="currentView === 'privacy'" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores';
import { ref } from 'vue';
import Privacy from './Privacy.vue';
import ThemeEditor from './ThemeEditor.vue';

const uiStore = useUiStore();

const currentView = ref('theme-editor');
</script>

<style scoped lang="scss">
.wrapper {
  position: relative;
  height: 100%;
  background-color: var(--app-drawer-bg-color);
  padding: var(--j-space-800);

  .sidebar-button {
    cursor: pointer;
    position: absolute;
    top: var(--j-space-500);
    left: var(--j-space-500);
    z-index: 1000;
  }

  .settings {
    display: flex;
    gap: var(--j-space-800);

    .sidebar {
      width: 100%;
      position: sticky;
      top: 0;
      left: 0;
    }
  }
}
</style>
