<template>
  <div class="left-drawer" v-if="community != null">
    <button class="left-drawer__header">
      <j-flex j="between" gap="300">
        <j-text nomargin size="600">
          {{ community.name }}
        </j-text>
        <j-icon size="xs" name="chevron-down"></j-icon>
      </j-flex>
    </button>

    <j-popover
      class="left-drawer__header-menu"
      event="click"
      placement="bottom-start"
      selector=".left-drawer__header"
    >
      <j-box pb="400" px="400">
        <j-flex a="center" gap="400">
          <j-avatar src="https://i.pravatar.cc/300" />
          <div>
            <j-text nomargin size="500">{{ community.name }}</j-text>
            <j-text nomargin color="ui-400" size="400">
              {{ community.description }}
            </j-text>
          </div>
        </j-flex>
      </j-box>
      <j-divider />
      <j-menu-item
        :value="communityName"
        @change="(e) => (communityName = e.target.value)"
        @click="showUpdateCommunity = true"
      >
        Edit information
      </j-menu-item>
      <j-menu-item>Invite people</j-menu-item>
      <j-divider />
      <j-menu-item @click="showCreateChannel = true"
        >Create a new channel</j-menu-item
      >
    </j-popover>

    <div class="left-drawer__channels">
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
    </div>

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
          @keydown.enter="saveCommunity"
          @input="(e) => (communityName = e.target.value)"
        ></j-input>
        <j-button
          size="lg"
          :loading="isSavingChannel"
          :disabled="isSavingChannel"
          @click="updateChannel"
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
        <j-tabs value="Public">
          <j-tab-item>Public</j-tab-item>
          <j-tab-item>Private</j-tab-item>
        </j-tabs>
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

export default defineComponent({
  props: ["community"],
  created() {
    this.communityName = this.community?.name;
  },
  data() {
    return {
      isCreatingChannel: false,
      channelName: "",
      showCreateChannel: false,
      isUpdatingCommunity: false,
      communityName: "",
      showUpdateCommunity: false,
    };
  },
  methods: {
    async updateChannel() {
      const { communityId } = this.$route.params;
      const name = this.communityName;
      this.isUpdatingCommunity = true;
      this.$store
        .dispatch("updateChannel", {
          communityId,
          name,
        })
        .then(() => {
          this.showUpdateCommunity = false;
          this.communityName = "";
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
          this.isCreatingChannel = false;
        });
    },
  },
});
</script>

<style lang="scss" scoped>
.left-drawer {
  width: 17vw;
  min-width: 250px;
  background-color: var(--j-color-white);
  border-right: 1px solid var(--j-color-ui-50);
}
.left-drawer__header {
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
.left-drawer__header-menu {
  padding-top: var(--j-space-500);
  padding-bottom: var(--j-space-300);
  border: 1px solid var(--j-color-ui-50);
  background: var(--j-color-white);
  border-radius: var(--j-border-radius);
  width: 19vw;
  min-width: 280px;
  z-index: 500;
}
.left-drawer__channels {
  padding-top: var(--j-space-500);
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}
</style>
