<template>
  <div class="mainView__topBar">
    <div class="mainView__topBar--title">
      <svg class="mainView__topBar--title--icon">
        <use :href="require('../../../assets/icons/icons.svg') + setIcon"></use>
      </svg>
      <p class="mainView__topBar--title--name">{{ currentView.name }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["currentView"],
  computed: {
    setIcon() {
      let icon;
      switch (this.currentView.type) {
        case "feed":
          icon = "#feed";
          break;
        case "channel":
          icon = "#hashtag";
          break;
        default:
          icon = "#feed";
          break;
      }
      return icon;
    },
  },
};
</script>
<style lang="scss">
.mainView__topBar {
  z-index: 2000;
  height: 7.5rem;
  background-color: var(--junto-background-color);
  width: 100%;
  border-bottom: 1px solid var(--junto-border-color);
  padding: 2rem;
  display: flex;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;

  &--title {
    display: flex;
    align-items: center;

    &--icon {
      fill: var(--junto-primary);
      height: 1.7rem;
      width: 1.7rem;
      margin-right: 0.5rem;
    }

    &--name {
      font-size: 1.7rem;
      font-weight: 700;
      color: var(--junto-primary);
    }
  }
}
</style>