<template>
  <j-box pl="500" pb="500">
    <j-text variant="heading-lg">Settings</j-text>
  </j-box>
  <div class="settings">
    <aside class="settings__sidebar">
      <j-tabs
        full
        vertical
        :value="currentView"
        @change="(e) => (currentView = e.target.value)"
      >
        <j-tab-item value="theme-editor"> Theming </j-tab-item>
        <j-tab-item value="privacy">Privacy</j-tab-item>
      </j-tabs>
    </aside>
    <div class="settings__content">
      <component :is="currentView" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ThemeEditor from "./ThemeEditor.vue";

export default defineComponent({
  components: { ThemeEditor },
  data() {
    return {
      currentView: "theme-editor",
    };
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
