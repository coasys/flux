<template>
  <j-flex direction="column" gap="700">
    <j-text variant="heading">Settings</j-text>
    <j-flex a="center" j="between">
      <j-text variant="label">Font family</j-text>
      <j-tabs
        :value="theme.fontFamily"
        @change="(e) => setTheme({ fontFamily: e.target.value })"
      >
        <j-tab-item value="default">Default</j-tab-item>
        <j-tab-item value="system">System</j-tab-item>
        <j-tab-item value="monospace">Monospace</j-tab-item>
      </j-tabs>
    </j-flex>
    <j-flex a="center" j="between">
      <j-text variant="label">Mode</j-text>
      <j-tabs
        :value="theme.name"
        @change="(e) => setTheme({ name: e.target.value })"
      >
        <j-tab-item value="light">Light</j-tab-item>
        <j-tab-item value="dark">Dark</j-tab-item>
        <j-tab-item value="rainbow">Rainbow</j-tab-item>
        <j-tab-item value="90s">90s</j-tab-item>
      </j-tabs>
    </j-flex>
    <j-flex a="center" j="between">
      <j-text variant="label">Primary color</j-text>
      <div class="colors">
        <button
          v-for="n in [0, 50, 100, 150, 200, 250, 270, 300]"
          :key="n"
          class="color-button"
          :class="{ 'color-button--active': theme.hue === n }"
          @click="() => setTheme({ hue: n })"
          :style="`--hue: ${n}`"
        ></button>
      </div>
    </j-flex>
    <j-flex a="center" j="between">
      <j-text variant="label">Clear State</j-text>
      <j-button size="md" variant="primary" @click="cleanState">
        <j-icon size="sm" name="trash"></j-icon>
        Clear state
      </j-button>
    </j-flex>
    <div>
      <j-button size="lg" variant="primary" @click="updateTheme">
        Done
      </j-button>
    </div>
  </j-flex>
</template>

<script lang="ts">
import { ThemeState } from "@/store";
import { defineComponent } from "vue";
import { mapMutations } from "vuex";

export default defineComponent({
  data() {
    return {
      hue: 270,
      fontFamily: "",
      themeName: "",
      themeHue: "",
    };
  },
  methods: {
    ...mapMutations(["setTheme"]),
    updateTheme() {
      this.$emit("submit");
    },
    cleanState() {
      console.log("Sending clean-state command");
      window.api.send("cleanState");
    },
  },
  computed: {
    theme(): ThemeState {
      return this.$store.state.ui.theme;
    },
  },
});
</script>

<style scoped>
.color-button {
  --hue: 0;
  width: var(--j-element-md);
  height: var(--j-element-md);
  background-color: hsl(var(--hue), 80%, 60%);
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
