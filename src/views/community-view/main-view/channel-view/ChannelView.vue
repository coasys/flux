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



<script>
import DirectMessage from "../../../../components/direct-message/display/DirectMessage.vue";
import CreateDirectMessage from "../../../../components/direct-message/create/CreateDirectMessage.vue";
export default {
  mounted() {
    this.scrollToBottom();
  },
  data() {
    return {
      messages: [
        {
          id: 12345,
          username: "urkyang",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Hey what is up everyone!",
        },
        {
          id: 56779,
          username: "jdeepee",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
        {
          id: 1,
          username: "urkyang",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Hey what is up everyone!",
        },
        {
          id: 2,
          username: "jdeepee",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
        {
          id: 3,
          username: "urkyang",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Hey what is up everyone!",
        },
        {
          id: 4,
          username: "jdeepee",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
        {
          id: 5,
          username: "urkyang",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Hey what is up everyone!",
        },
        {
          id: 6,
          username: "jdeepee",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
        {
          id: 7,
          username: "urkyang",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
        {
          id: 8,
          username: "jdeepee",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
        {
          id: 9,
          username: "urkyang",
          profilePicture: "./../../../assets/images/junto_app_icon.png",
          type: "TextMessage",
          message: "Welcome to Junto!",
        },
      ],
    };
  },
  methods: {
    createDirectMessage(message) {
      this.messages.push(message);
      setTimeout(this.scrollToBottom, 300);
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      container.scrollTop = container.scrollHeight;
    },
  },

  components: {
    DirectMessage,
    CreateDirectMessage,
  },
};
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