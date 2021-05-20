<template>
  <div class="directMessage">
    <direct-message-meta
      v-if="showAvatar"
      :message="message"
    ></direct-message-meta>
    <text-message :text="JSON.parse(message.data).body"></text-message>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import TextMessage from "./types/TextMessage.vue";
import DirectMessageMeta from "./DirectMessageMeta.vue";

export default defineComponent({
  props: {
    message: Object,
    showAvatar: Boolean,
  },
  components: {
    TextMessage,
    DirectMessageMeta,
  },
});
</script>

<style lang="scss" scoped>
.directMessage {
  display: flex;
  flex-direction: column;
  // padding-bottom: 1.5rem;
  color: var(--junto-primary);
  width: 100%;
}
</style>
