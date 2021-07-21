<template>
  <div>
    <j-box pb="800">
      <j-box pb="800">
        <j-box pb="300">
          <j-text size="500" weight="400" color="ui-700">Primary color</j-text>
        </j-box>
        <div class="colors">
          <button
            v-for="n in [0, 20, 50, 100, 150, 200, 220, 250, 270, 300, 340]"
            :key="n"
            class="color-button"
            :class="{ 'color-button--active': theme.hue === n }"
            @click="() => updateTheme({ hue: n })"
            :style="`--hue: ${n}`"
          ></button>
        </div>
      </j-box>
      <j-box pb="300">
        <j-text size="500" weight="400" color="ui-700">Theme</j-text>
      </j-box>
      <j-tabs
        :value="theme.name"
        @change="(e) => updateTheme({ name: e.target.value })"
      >
        <j-tab-item variant="button" value="light">Light</j-tab-item>
        <j-tab-item variant="button" value="dark">Dark</j-tab-item>
        <j-tab-item variant="button" value="black">Black</j-tab-item>
        <j-tab-item variant="button" value="rainbow">Rainbow</j-tab-item>
        <j-tab-item variant="button" value="cyberpunk">Cyberpunk</j-tab-item>
        <j-tab-item variant="button" value="90s">90s</j-tab-item>
      </j-tabs>
    </j-box>
    <j-box pb="800">
      <j-box pb="300">
        <j-text size="500" weight="400" color="ui-700">Font family</j-text>
      </j-box>
      <j-tabs
        :value="theme.fontFamily"
        @change="(e) => updateTheme({ fontFamily: e.target.value })"
      >
        <j-tab-item variant="button" value="default">Default</j-tab-item>
        <j-tab-item variant="button" value="system">System</j-tab-item>
        <j-tab-item variant="button" value="monospace">Monospace</j-tab-item>
      </j-tabs>
    </j-box>
    <j-box pb="800">
      <j-box pb="300">
        <j-text size="500" weight="400" color="ui-700">Saturation</j-text>
      </j-box>
      <j-tabs
        :value="theme.saturation"
        @change="(e) => updateTheme({ saturation: e.target.value })"
      >
        <j-tab-item variant="button" value="30">Weak</j-tab-item>
        <j-tab-item variant="button" value="60">Normal</j-tab-item>
        <j-tab-item variant="button" value="100">Vibrant</j-tab-item>
      </j-tabs>
    </j-box>
    <j-box pb="800">
      <j-box pb="300">
        <j-text size="500" weight="400" color="ui-700">Font size</j-text>
      </j-box>
      <j-tabs
        :value="theme.fontSize"
        @change="(e) => updateTheme({ fontSize: e.target.value })"
      >
        <j-tab-item variant="button" value="sm">Small</j-tab-item>
        <j-tab-item variant="button" value="md">Medium</j-tab-item>
        <j-tab-item variant="button" value="lg">Large</j-tab-item>
      </j-tabs>
    </j-box>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["update"],
  props: ["theme"],
  methods: {
    updateTheme(val: any) {
      if (this.theme) {
        this.$emit("update", val);
      }
    },
  },
});
</script>

<style scoped>
.color-button {
  --hue: 0;
  --saturation: 80%;
  width: var(--j-size-md);
  height: var(--j-size-md);
  background-color: hsl(var(--hue), var(--saturation), 60%);
  border: 2px solid transparent;
  outline: 0;
  border-radius: var(--j-border-radius);
}
.color-button--active {
  border-color: var(--j-color-primary-600);
}
.colors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--j-space-200);
  max-width: 400px;
}
</style>
