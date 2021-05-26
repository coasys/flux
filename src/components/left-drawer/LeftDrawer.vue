<template>
  <div class="left-drawer" v-if="community != null">
    <j-box px="500" pt="500">
      <j-text variant="heading-sm">{{ community.value.name }}</j-text>
      <j-text variant="ingress">{{ community.value.description }}</j-text>
    </j-box>

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
            communityId: community.value.perspective,
            channelId: channel.perspective,
          },
        }"
        custom
        v-slot="{ navigate, isExactActive }"
        v-for="channel in community.value.channels"
        :key="channel.perspective"
      >
        <j-menu-item :selected="isExactActive" @click="navigate" size="md">
          <j-icon slot="start" size="sm" name="hash"></j-icon>
          {{ channel.name }}
        </j-menu-item>
      </router-link>
    </j-menu-group-item>
    <j-modal
      :open="showCreateChannel"
      @toggle="(e) => (showCreateChannel = e.target.open)"
    >
      <j-text variant="heading">Create Channel</j-text>
      <j-text variant="body">
        Channels are ways to organize your conversations by topics.
      </j-text>
      <j-input
        label="Name"
        :value="channelName"
        @input="(e) => (channelName = e.target.value)"
      ></j-input>
      <j-button @click="createChannel" variant="primary">
        Create Channel
      </j-button>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["community"],
  data() {
    return {
      channelName: "",
      showCreateChannel: false,
    };
  },
  methods: {
    async createChannel() {
      this.$store.dispatch("createChannel", { name: this.channelName });
    },
  },
});
</script>

<style lang="scss" scoped>
.left-drawer {
  width: 15vw;
  min-width: 20rem;
  background-color: var(--junto-background-color);
  border-right: 1px solid var(--junto-border-color);
}
</style>
