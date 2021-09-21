<template>
  <chat-view :perspective-uuid="$route.params.channelId"></chat-view>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ChannelView",
});
</script>
