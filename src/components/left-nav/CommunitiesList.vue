<template>
  <div class="left-nav__communities-list">
    <router-link
      v-for="community in getCommunities"
      :key="community.perspective"
      :to="{
        name: 'community',
        params: { communityId: community.perspective },
      }"
      v-slot="{ navigate, isActive }"
    >
      <j-tooltip :title="community.name">
        <j-avatar
          :selected="isActive"
          size="xl"
          :src="require('@/assets/images/junto_app_icon.png')"
          initials="false"
          @click="() => navigate()"
        ></j-avatar>
      </j-tooltip>
    </router-link>
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
          <j-button @click="joinCommunity" size="lg" full variant="primary">
            Join Community
          </j-button>
        </j-flex>
      </j-flex>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { useStore } from "vuex";
import { defineComponent, ref } from "vue";
import { CommunityState } from "@/store";

export default defineComponent({
  setup() {
    const store = useStore();

    const joiningLink = ref("");

    const newCommunityName = ref("");
    const newCommunityDesc = ref("");

    const showModal = ref(false);
    const isCreatingCommunity = ref(false);
    const tabView = ref("Create");

    const changeCommunity = (community: CommunityState) => {
      store.commit("changeCommunity", community);
    };

    const handleCommunityClick = (community: CommunityState) => {
      changeCommunity(community);
    };

    const createCommunity = () => {
      isCreatingCommunity.value = true;
      store
        .dispatch("createCommunity", {
          perspectiveName: newCommunityName.value,
          description: newCommunityDesc.value,
        })
        .then(() => {
          showModal.value = false;
          newCommunityName.value = "";
          newCommunityDesc.value = "";
        })
        .finally(() => {
          isCreatingCommunity.value = false;
        });
    };

    const joinCommunity = () => {
      store.dispatch("joinCommunity", {
        joiningLink: joiningLink.value,
      });
    };

    return {
      joiningLink,
      joinCommunity,
      newCommunityName,
      newCommunityDesc,
      createCommunity,
      tabView,
      showModal,
      isCreatingCommunity,
      handleCommunityClick,
    };
  },

  computed: {
    getCommunities() {
      const communities = this.$store.getters.getCommunities;

      return communities;
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
