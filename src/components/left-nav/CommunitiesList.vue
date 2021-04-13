<template>
  <div class="left-nav__communities-list">
    <community-avatar
      v-for="community in getCommunities"
      :key="community.name"
      :community="community"
    ></community-avatar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CommunityAvatar from "./../ui/avatar/CommunityAvatar.vue";

export default defineComponent({
  computed: {
    getCommunities() {
      return this.$store.getters.getCommunities;
    },
  },

  components: { CommunityAvatar },
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