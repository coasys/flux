<template>
  <div class="channelView">
    <div class="channelView__messages" ref="messagesContainer">
      <direct-message
        v-for="message in messages"
        :key="message.id"
        :message="message"
      ></direct-message>
    </div>

    <create-direct-message
      :createMessage="createDirectMessage"
    ></create-direct-message>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type Expression from "@perspect3vism/ad4m/Expression";
import DirectMessage from "../../../../components/direct-message/display/DirectMessage.vue";
import CreateDirectMessage from "../../../../components/direct-message/create/CreateDirectMessage.vue";

export default defineComponent({
  props: ["community"],
  mounted() {
    console.log("Messages in channel view", this.messages);
    this.scrollToBottom();
  },
  data() {
    return {
      messages: this.$store.getters.getCurrentChannelsLinks,
    };
  },
  methods: {
    createDirectMessage(message: Expression) {
      setTimeout(this.scrollToBottom, 300);
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      //@ts-ignore
      container.scrollTop = container.scrollHeight;
    },
  },

  components: {
    DirectMessage,
    CreateDirectMessage,
  },
});
</script>

<style lang="scss">
.channelView {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  max-height: 100vh;

  &__messages {
    overflow: scroll;
    // 9.5 = 7.5rem (height of MainVewTopBar) + 2rem
    padding: 9.5rem 2rem 7.5rem 2rem;
  }
}
</style>
