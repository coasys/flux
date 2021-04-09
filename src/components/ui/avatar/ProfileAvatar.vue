<template>
  <div class="profile-avatar" :style="avatarDiameter">&nbsp;</div>
</template>

<script>
export default {
  props: ["profile-image", "diameter"],
  computed: {
    avatarDiameter() {
      return (
        "height:" + this.diameter + "rem; width: " + this.diameter + "rem;"
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.profile-avatar {
  background-color: var(--junto-border-color);
  border-radius: 100px;
  background-image: url("../../../../src/assets/images/junto_app_icon.png");
  background-size: cover;
}
</style>