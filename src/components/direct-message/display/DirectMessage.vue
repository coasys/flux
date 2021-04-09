<template>
  <div class="directMessage">
    <direct-message-meta :message="message"></direct-message-meta>
    <text-message :text="message.message"></text-message>
  </div>
</template>

<script>
import TextMessage from "./types/TextMessage.vue";
import DirectMessageMeta from "./DirectMessageMeta.vue";
export default {
  props: ["message"],
  components: {
    TextMessage,
    DirectMessageMeta,
  },
};
</script>

<style lang="scss" scoped>
.directMessage {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
  color: var(--junto-primary);
}
</style>