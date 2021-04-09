<template>
  <button class="toggleThemeButton" @click="toggleTheme">
    <svg class="toggleThemeButton__icon">
      <use :href="require('../../../assets/icons/icons.svg') + themeIcon"></use>
    </svg>
  </button>
</template>


<script>
export default {
  methods: {
    toggleTheme() {
      if (this.currentTheme === "light") {
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
      if (this.currentTheme === "light") {
        return "#sun";
      } else {
        return "#moon";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.toggleThemeButton {
  padding: 1rem 2rem;
  outline: none;
  border: 1px solid var(--junto-border-color);
  background-color: var(--junto-border-color);
  margin-bottom: 2rem;
  border-radius: 15px;

  &:hover {
    cursor: pointer;
  }
  &__icon {
    height: 1.7rem;
    width: 1.7rem;
    fill: var(--junto-primary);
  }
}
</style>