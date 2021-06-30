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
    openMember: Function,
    openedProfile: Object
  },
  mounted() {
    const { communityId, channelId } = this.$route.params;
    
    const mentionElements = document.querySelectorAll('.mention');

    for (const ele of mentionElements) {
      const mention = ele as HTMLElement;
      mention.onclick = () => {
        if (mention.dataset.label?.startsWith('#')) {
          console.log(mention.dataset);
          this.$router.push({
            name: "channel",
            params: {
              communityId,
              channelId: mention.dataset.id!,
            },
          });
        } else {
          // TODO: show user card here...
          const popup = document.getElementById('profileCard') as HTMLElement;

          const mentionRect = mention.getBoundingClientRect();

          const popupRect = popup.getBoundingClientRect();

          popup.style.top = `${mentionRect.top - popupRect.height}px`;
          popup.style.left = `${mentionRect.left}px`;
          popup.style.opacity = '1';
          popup.style.zIndex = '100';


          this.openMember!(mention.dataset.id!);
        }
      }
    }

  }
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
