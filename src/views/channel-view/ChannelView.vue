<template>
  <chat-view :perspective-uuid="$route.params.channelId"></chat-view>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import ChatView from "junto-plugin-chat-view";

customElements.define("chat-view", ChatView);

export default defineComponent({
  name: "ChannelView",
});
</script>
