<template>
  <div class="profile-avatar" id="fileInputButton" @click="onFileClick()">
    <j-avatar
      id="myProfile"
      size="xl"
      :src="profileImage ?? require('@/assets/images/junto_app_icon.png')"
      initials="P"
    ></j-avatar>
  </div>
  <input
    id="fileInput"
    type="file"
    style="display: none"
    v-on:change="onClick"
  />
</template>

<script>
export default {
  props: ["profileImage", "diameter", "onClick", "enableFileSelection"],
  computed: {
    avatarDiameter() {
      return (
        "height:" + this.diameter + "rem; width: " + this.diameter + "rem;"
      );
    },
    profilePic() {
      return this.profileImage
        ? `background-image: url(${this.profileImage});`
        : "";
    },
  },
  methods: {
    onFileClick() {
      if (this.enableFileSelection) {
        document.getElementById("fileInput").click();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.profile-avatar {
  background-color: var(--junto-border-color);
  border-radius: 100px;
  background-size: cover;
}
</style>
