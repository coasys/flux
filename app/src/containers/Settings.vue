<template>
  <j-box p="800">
    <j-box pb="800">
      <j-text variant="heading">Settings</j-text>
    </j-box>
    <div class="settings">
      <aside class="settings__sidebar">
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
        <div class="settings__content">
          <ThemeEditor v-if="currentView === 'theme-editor'" />
          <Privacy v-if="currentView === 'privacy'" />
        </div>
      </aside>
    </div>
  </j-box>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Privacy from "./Privacy.vue";
import ThemeEditor from "./ThemeEditor.vue";

const currentView = ref("theme-editor");
</script>

<style scoped>
.settings {
  display: flex;
  gap: var(--j-space-800);
}

.settings__sidebar {
  width: 100%;
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
