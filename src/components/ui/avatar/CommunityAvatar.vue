<template>
  <div class="community-avatar" @click="navToCommunity()">
    <div class="community-avatar__name">
      <p class="community-avatar__name--text">{{ community.name }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["community"],
  methods: {
    navToCommunity() {
      this.$store.commit({ type: "changeCommunity", value: this.community });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../../assets/sass/main.scss";
.community-avatar {
  height: 5rem;
  width: 5rem;
  background-color: var(--junto-border-color);
  border-radius: 100px;
  margin-bottom: 2rem;
  background-image: url("../../../../src/assets/images/junto_app_icon.png");
  background-size: cover;
  position: relative;

  &:hover {
    cursor: pointer;
    transition: all 0.2s;
  }

  &:hover &__name {
    visibility: visible;
    transition: all 0.2s;
  }

  &__name {
    visibility: hidden;
    padding: 1rem;
    background-color: var(--junto-primary);
    border-radius: 5px;
    position: absolute;
    top: 0.5rem;
    left: 6rem;

    &--text {
      color: var(--junto-background-color);
      font-size: 1.2rem;
      font-weight: 700;
    }
  }
}
</style>