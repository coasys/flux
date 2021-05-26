<template>
  <div class="left-nav__bottom-section">
    <j-button
      size="xl"
      @click="toggleTheme"
      square
      circle
      variant="transparent"
    >
      <j-icon :name="themeIcon"></j-icon>
    </j-button>

    <j-tooltip title="My profile">
      <j-avatar
        id="avatar"
        size="xl"
        :src="require('../../../src/assets/images/junto_app_icon.png')"
        initials="P"
      ></j-avatar>
    </j-tooltip>
  </div>
</template>

<script>
export default {
  methods: {
    toggleTheme() {
      if (this.$store.state.currentTheme === "light") {
        this.$store.commit({ type: "toggleTheme", value: "dark" });
      } else {
        this.$store.commit({ type: "toggleTheme", value: "light" });
      }
    },
  },
  computed: {
    currentTheme() {
      return this.$store.getters.getCurrentTheme;
    },
    themeIcon() {
      if (this.$store.state.currentTheme === "light") {
        return "sun";
      } else {
        return "moon";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.left-nav__bottom-section {
  width: 100%;
  border-top: 1px var(--j-color-ui-50) solid;
  padding: 2rem 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
