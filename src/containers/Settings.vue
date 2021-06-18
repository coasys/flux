<template>
  <j-flex direction="column" gap="700">
    <j-text variant="heading">Settings</j-text>
    <j-flex a="center" j="between">
      <j-text variant="label">Font family</j-text>
      <j-tabs
        :value="fontFamily"
        @change="(e) => (fontFamily = e.target.value)"
      >
        <j-tab-item value="default">Default</j-tab-item>
        <j-tab-item value="system">System</j-tab-item>
        <j-tab-item value="monospace">Monospace</j-tab-item>
      </j-tabs>
    </j-flex>
    <j-flex a="center" j="between">
      <j-text variant="label">Mode</j-text>
      <j-tabs :value="themeName" @change="(e) => (themeName = e.target.value)">
        <j-tab-item value="light">Light</j-tab-item>
        <j-tab-item value="dark">Dark</j-tab-item>
        <j-tab-item value="rainbow">Rainbow</j-tab-item>
        <j-tab-item value="cyberpunk">Cyberpunk</j-tab-item>
      </j-tabs>
    </j-flex>
    <j-flex a="center" j="between">
      <j-text variant="label">Primary color</j-text>
      <div class="colors">
        <button
          v-for="n in [0, 50, 100, 150, 200, 250, 270, 300]"
          :key="n"
          class="color-button"
          :class="{ 'color-button--active': themeHue === n }"
          @click="() => (themeHue = n)"
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
      <j-button size="lg" @click="$emit('cancel')">Cancel</j-button>
      <j-button size="lg" variant="primary" @click="updateTheme">
        Save
      </j-button>
    </div>
  </j-flex>
</template>

<script lang="ts">
import { ThemeState } from "@/store";
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      hue: getComputedStyle(document.documentElement).getPropertyValue(
        "--j-color-primary-hue"
      ),
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue(
        "--j-font-family"
      ),
      themeName: "",
      themeHue: "",
    };
  },
  watch: {
    themeHue: function (val) {
      document.documentElement.style.setProperty("--j-color-primary-hue", val);
    },
    themeName: function (val) {
      import(`../themes/${val}.css`);
      document.documentElement.setAttribute("theme", val);
    },
    fontFamily: function (val: "system" | "default") {
      const font = {
        default: `"Avenir", sans-serif`,
        monospace: `monospace`,
        system: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
      };
      document.documentElement.style.setProperty("--j-font-family", font[val]);
    },
    "theme.name": {
      handler: function (val: string): void {
        this.themeName = val;
      },
      immediate: true,
    },
    "theme.hue": {
      handler: function (val: string): void {
        this.themeHue = val;
      },
      immediate: true,
    },
    "theme.fontFamily": {
      handler: function (val: string): void {
        this.fontFamily = val;
      },
      immediate: true,
    },
  },
  methods: {
    resetTheme() {
      this.$store.commit("setTheme", {
        name: this.theme.name,
        hue: this.theme.hue,
      });
    },
    updateTheme() {
      this.$store.commit("setTheme", {
        name: this.themeName,
        hue: this.themeHue,
      });
      this.$emit("submit");
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
