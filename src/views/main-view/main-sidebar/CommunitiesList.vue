<template>
  <div class="left-nav__communities-list">
    <j-tooltip
      v-for="community in getCommunities"
      :key="community.perspective"
      :title="community.name"
    >
      <j-avatar
        :selected="communityIsActive(community.perspective)"
        size="xl"
        :src="require('@/assets/images/junto_app_icon.png')"
        initials="false"
        @click="() => handleCommunityClick(community.perspective)"
      ></j-avatar>
    </j-tooltip>

    <j-tooltip title="Create comminuty">
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
      <j-flex direction="column" gap="700">
        <div>
          <j-text variant="heading" v-if="tabView === 'Create'"
            >Create a community
          </j-text>
          <j-text variant="heading" v-if="tabView === 'Join'"
            >Join a community
          </j-text>
          <j-text nomargin variant="ingress">
            Communities are the building blocks of Junto.
          </j-text>
        </div>
        <j-tabs
          size="lg"
          :value="tabView"
          @change="(e) => (tabView = e.target.value)"
        >
          <j-tab-item>Create</j-tab-item>
          <j-tab-item>Join</j-tab-item>
        </j-tabs>
        <j-flex direction="column" gap="500" v-if="tabView === 'Create'">
          <j-input
            size="lg"
            label="Name"
            @input="(e) => (newCommunityName = e.target.value)"
            :value="newCommunityName"
          ></j-input>
          <j-input
            size="lg"
            label="Description"
            :value="newCommunityDesc"
            @keydown.enter="createCommunity"
            @input="(e) => (newCommunityDesc = e.target.value)"
          ></j-input>
          <j-button
            :loading="isCreatingCommunity"
            :disabled="isCreatingCommunity"
            size="lg"
            full
            variant="primary"
            @click="createCommunity"
          >
            Create Community
          </j-button>
        </j-flex>
        <j-flex direction="column" gap="200" v-if="tabView === 'Join'">
          <j-input
            :value="joiningLink"
            @input="(e) => (joiningLink = e.target.value)"
            size="lg"
            label="Invite link"
          ></j-input>
          <j-button
            :disabled="isJoiningCommunity"
            :loading="isJoiningCommunity"
            @click="joinCommunity"
            size="lg"
            full
            variant="primary"
          >
            Join Community
          </j-button>
        </j-flex>
      </j-flex>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      tabView: "Create",
      joiningLink: "",
      newCommunityName: "",
      newCommunityDesc: "",
      showModal: false,
      isJoiningCommunity: false,
      isCreatingCommunity: false,
    };
  },
  methods: {
    joinCommunity() {
      this.isJoiningCommunity = true;
      this.$store
        .dispatch("joinCommunity", { joiningLink: this.joiningLink })
        .then(() => {
          this.showModal = false;
        })
        .finally(() => {
          this.isJoiningCommunity = false;
        });
    },
    createCommunity() {
      this.isCreatingCommunity = true;
      this.$store
        .dispatch("createCommunity", {
          perspectiveName: this.newCommunityName,
          description: this.newCommunityDesc,
        })
        .then(() => {
          this.showModal = false;
          this.newCommunityName = "";
          this.newCommunityDesc = "";
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
    handleCommunityClick(communityId: string) {
      this.$router.push({ name: "community", params: { communityId } });
      if (this.communityIsActive(communityId)) {
        this.$store.commit("toggleSidebar");
      }
    },
  },
  computed: {
    getCommunities() {
      const communities = this.$store.getters.getCommunities;
      return communities;
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
</style>
