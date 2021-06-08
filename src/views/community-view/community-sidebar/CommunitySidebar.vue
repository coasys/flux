<template>
  <div class="left-drawer" v-if="community != null">
    <button class="left-drawer__header">
      <j-flex j="between" gap="300">
        <j-flex gap="400">
          <j-avatar
            style="--j-avatar-size: 35px"
            :src="require('@/assets/images/junto_app_icon.png')"
          />
          <div>
            <j-text weight="500" color="ui-800" nomargin size="500">
              {{ community.name }}
            </j-text>
            <j-text weight="300" color="ui-800" nomargin size="400">
              {{ community.description }}
            </j-text>
          </div>
        </j-flex>
        <j-icon size="xs" name="chevron-down"></j-icon>
      </j-flex>
    </button>

    <j-popover
      class="left-drawer__header-menu"
      event="click"
      placement="bottom-start"
      selector=".left-drawer__header"
    >
      <j-menu>
        <j-menu-item
          :value="communityName"
          @change="(e) => (communityName = e.target.value)"
          @click="showUpdateCommunity = true"
        >
          <j-icon size="xs" slot="start" name="pencil" />
          Edit community
        </j-menu-item>
        <j-menu-item @click="getInviteCode">
          <j-icon size="xs" slot="start" name="person-plus" />
          Invite people
        </j-menu-item>
        <j-divider />
        <j-menu-item @click="showCreateChannel = true">
          <j-icon size="xs" slot="start" name="plus" />
          Create a new channel
        </j-menu-item>
      </j-menu>
    </j-popover>

    <j-box pt="500" px="500" pb="500">
      <avatar-group
        @click="showGroupMembers = true"
        :users="[
          { username: 'test' },
          { username: 'test' },
          { username: 'test' },
          { username: 'test' },
          { username: 'test' },
        ]"
      />
    </j-box>

    <j-box pt="500">
      <j-menu-group-item open title="Channels">
        <j-button
          @click.prevent="showCreateChannel = true"
          size="sm"
          slot="end"
          variant="transparent"
        >
          <j-icon size="sm" square name="plus"></j-icon>
        </j-button>
        <router-link
          :to="{
            name: 'channel',
            params: {
              communityId: community.perspective,
              channelId: channel.perspective,
            },
          }"
          custom
          v-slot="{ navigate, isExactActive }"
          v-for="channel in community.channels"
          :key="channel.perspective"
        >
          <j-menu-item :selected="isExactActive" @click="navigate">
            <j-icon slot="start" size="sm" name="hash"></j-icon>
            {{ channel.name }}
          </j-menu-item>
        </router-link>
      </j-menu-group-item>
    </j-box>

    <j-modal
      :open="showGroupMembers"
      @toggle="(e) => (showGroupMembers = e.target.open)"
    >
      <j-flex gap="500" direction="column">
        <j-text variant="heading">All group members (5)</j-text>
        <j-input placeholder="Search for member" type="search"></j-input>
        <j-flex wrap gap="600">
          <j-flex
            gap="300"
            v-for="index in 5"
            :key="index"
            inline
            direction="column"
            a="center"
          >
            <j-avatar size="lg" />
            <j-text variant="body">Username</j-text>
          </j-flex>
        </j-flex>
      </j-flex>
    </j-modal>

    <j-modal
      :open="showUpdateCommunity"
      @toggle="(e) => (showUpdateCommunity = e.target.open)"
    >
      <j-text variant="heading">Edit Community</j-text>
      <j-flex direction="column" gap="400">
        <j-input
          size="lg"
          label="Name"
          :value="communityName"
          @input="(e) => (communityName = e.target.value)"
        ></j-input>
        <j-input
          size="lg"
          label="Description"
          :value="communityDescription"
          @keydown.enter="updateCommunity"
          @input="(e) => (communityDescription = e.target.value)"
        ></j-input>
        <j-button
          size="lg"
          :loading="isUpdatingCommunity"
          :disabled="isUpdatingCommunity"
          @click="updateCommunity"
          variant="primary"
        >
          Save
        </j-button>
      </j-flex>
    </j-modal>

    <j-modal
      :open="showCreateChannel"
      @toggle="(e) => (showCreateChannel = e.target.open)"
    >
      <j-text variant="heading">Create Channel</j-text>
      <j-text variant="body">
        Channels are ways to organize your conversations by topics.
      </j-text>
      <j-flex direction="column" gap="400">
        <j-input
          size="lg"
          label="Name"
          :value="channelName"
          @keydown.enter="createChannel"
          @input="(e) => (channelName = e.target.value)"
        ></j-input>
        <j-button
          size="lg"
          :loading="isCreatingChannel"
          :disabled="isCreatingChannel"
          @click="createChannel"
          variant="primary"
        >
          Create Channel
        </j-button>
      </j-flex>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";

export default defineComponent({
  components: { AvatarGroup },
  props: ["community"],
  watch: {
    community: {
      handler: function ({ name, description }) {
        this.communityName = name;
        this.communityDescription = description;
      },
      deep: true,
      immediate: true,
    },
  },
  data() {
    return {
      isCreatingChannel: false,
      channelName: "",
      showCreateChannel: false,
      isUpdatingCommunity: false,
      communityName: "",
      communityDescription: "",
      showUpdateCommunity: false,
      showGroupMembers: false,
    };
  },
  methods: {
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      let currentCommunity = this.community;
      const el = document.createElement("textarea");
      el.value = `Hey! Here is an invite code to join my private community on Junto: ${currentCommunity.sharedPerspectiveUrl}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      this.$store.commit("showSuccessToast", {
        message: "Your custom invite code is copied to your clipboard!",
      });
    },
    async updateCommunity() {
      const { communityId } = this.$route.params;
      this.isUpdatingCommunity = true;
      this.$store
        .dispatch("updateCommunity", {
          communityId: communityId,
          name: this.communityName,
          description: this.communityDescription,
        })
        .then(() => {
          this.showUpdateCommunity = false;
        })
        .finally(() => {
          this.isUpdatingCommunity = false;
        });
    },
    async createChannel() {
      const { communityId } = this.$route.params;
      const name = this.channelName;
      this.isCreatingChannel = true;
      this.$store
        .dispatch("createChannel", {
          communityId,
          name,
        })
        .then(() => {
          this.showCreateChannel = false;
          this.channelName = "";
        })
        .finally(() => {
          this.isCreatingChannel = false;
        });
    },
  },
});
</script>

<style lang="scss" scoped>
.left-drawer {
  width: clamp(300px, 18vw, 400px);
  background-color: var(--j-color-white);
  border-right: 1px solid var(--j-color-ui-50);
}

.left-drawer__header {
  color: inherit;
  width: 100%;
  display: block;
  border: 0;
  outline: 0;
  font-family: inherit;
  text-align: left;
  background: none;
  cursor: pointer;
  padding: var(--j-space-400) var(--j-space-500);
  border-bottom: 1px solid var(--j-color-ui-50);
}

.left-drawer__header:hover {
  background: var(--j-color-ui-50);
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}
</style>
