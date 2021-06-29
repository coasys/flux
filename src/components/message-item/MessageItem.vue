<template>
  <j-message-item
    class="message-item"
    :hideuser="!showAvatar"
    :timestamp="timestamp"
  >
    <j-avatar :hash="did" :src="profileImg" slot="avatar" />
    <span slot="username">{{ username }}</span>
    <div class="message-item__message" slot="message" v-html="message"></div>
  </j-message-item>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    did: String,
    timestamp: String,
    username: String,
    message: String,
    profileImg: String,
    showAvatar: Boolean,
  },
});
</script>

<style scoped>
.message-item__message {
  font-size: var(--j-font-size-400);
}

.message-item__message > :first-of-type {
  margin-top: 0;
}

.message-item__message > :last-of-type {
  margin-bottom: 0;
}
</style>
