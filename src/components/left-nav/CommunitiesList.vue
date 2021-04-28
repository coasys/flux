<template>
  <div class="left-nav__communities-list">
    <community-avatar
      v-for="community in getCommunities"
      :key="community.value.perspective"
      :community="community"
    ></community-avatar>
    <create-community-icon></create-community-icon>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CommunityAvatar from "./../ui/avatar/CommunityAvatar.vue";
import CreateCommunityIcon from './create-community/CreateCommunityIcon.vue';

export default defineComponent({
  computed: {
    getCommunities() {
      return this.$store.getters.getCommunities;
    },
  },

  components: { CommunityAvatar, CreateCommunityIcon },
});
</script>

<style lang="scss" scoped>
.left-nav__communities-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>