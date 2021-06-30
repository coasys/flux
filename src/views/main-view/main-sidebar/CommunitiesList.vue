<template>
  <div class="left-nav__communities-list">
    <j-tooltip
      v-for="community in communities"
      :key="community.perspective"
      :title="community.name"
    >
      <j-avatar
        class="left-nav__community-item"
        :selected="communityIsActive(community.perspective)"
        size="xl"
        :src="require('@/assets/images/junto_app_icon.png')"
        initials="false"
        @click="() => handleCommunityClick(community.perspective)"
      ></j-avatar>
    </j-tooltip>

    <j-tooltip title="Create community">
      <j-button
        @click="showModal = true"
        variant="primary"
        square
        circle
        size="xl"
      >
        <j-icon size="lg" name="plus"></j-icon>
      </j-button>
    </j-tooltip>

    <j-modal :open="showModal" @toggle="(e) => (showModal = e.target.open)">
      <create-community
        @submit="showModal = false"
        @cancel="showModal = false"
      />
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CreateCommunity from "@/containers/CreateCommunity.vue";

export default defineComponent({
  components: { CreateCommunity },
  data() {
    return {
      showModal: false,
    };
  },
  methods: {
    handleCommunityClick(communityId: string) {
      if (this.communityIsActive(communityId)) {
        this.$store.commit("toggleSidebar");
      } else {
        this.$store.commit("setSidebar", true);
        this.$router.push({ name: "community", params: { communityId } });
      }
    },
  },
  computed: {
    communities() {
      return this.$store.state.communities;
    },
    communityIsActive() {
      return (id: string) => this.$route.params.communityId === id;
    },
  },
});
</script>

<style lang="scss" scoped>
.left-nav__communities-list {
  width: 100%;
  height: 100%;
  display: flex;
  padding-top: var(--j-space-200);
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
  overflow-y: scroll;
  overflow-x: visible;
  margin-bottom: 25vh;

  &::-webkit-scrollbar {
    display: none;
  }
}

.left-nav__community-item {
  cursor: pointer;
}
</style>
