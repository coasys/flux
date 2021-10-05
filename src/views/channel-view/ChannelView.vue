<template>
  <chat-view
    :perspective-uuid="channel.neighbourhood.perspective.uuid"
  ></chat-view>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ChannelState, CommunityState } from "@/store/types";
import { useDataStore } from "@/store/data";

export default defineComponent({
  name: "ChannelView",
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
      script: null as HTMLElement | null,
    };
  },

  async mounted() {
    this.script = document.createElement("script");
    this.script.setAttribute("type", "module");
    this.script.innerHTML = `
      import ChatView from 'https://unpkg.com/junto-plugin-chat-view-simple@0.0.1/dist/main.js';
      customElements.define("chat-view", ChatView);
    `;
    this.script;
    document.body.appendChild(this.script);
  },

  unmounted() {
    document.body.removeChild(this.script as any);
  },

  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.dataStore.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const { channelId } = this.$route.params;
      return this.dataStore.getChannel(channelId as string);
    },
  },
});
</script>
