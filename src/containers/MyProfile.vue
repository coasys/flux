<template>
  <j-box pb="1000">
    <j-box pb="500">
      <j-flex gap="500" a="center" j="between" wrap>
        <j-avatar
          style="--j-avatar-size: 150px"
          :src="userProfile.profilePicture"
          :hash="userDid"
        />
        <j-button
          size="lg"
          @click="() => $store.commit('setShowEditProfile', true)"
        >
          <j-icon size="sm" name="pencil" />
          Edit profile
        </j-button>
      </j-flex>
    </j-box>
    <j-box pb="500">
      <j-text size="600" color="ui-300">@{{ userProfile.username }}</j-text>
      <j-text variant="heading-lg"
        >{{ userProfile.givenName }} {{ userProfile.familyName }}</j-text
      >
    </j-box>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  computed: {
    communities() {
      return this.$store.state.communities;
    },
    userProfile() {
      return this.$store.state.userProfile;
    },
    userDid() {
      return this.$store.state.userDid;
    },
  },
});
</script>

<style scoped>
.community-items {
  display: grid;
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-border-color);
  grid-template-columns: 1fr;
}

.community-item {
  text-decoration: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--j-space-700);
  align-items: center;
  height: 100%;
  cursor: pointer;
  width: 100%;
  justify-content: space-between;
  padding: var(--j-space-500);
  border-bottom: 1px solid var(--j-border-color);
  transition: all 0.2s ease;
}

.community-item__content {
  flex: 1;
}

.community-item:hover {
  background: var(--j-color-ui-50);
}
</style>
