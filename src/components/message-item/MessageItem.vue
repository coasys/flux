<template>
  <div class="message-item">
    <div class="message-item__left-column">
      <j-avatar v-if="showAvatar" :hash="did" :src="profileImg" />

      <j-timestamp
        class="message-item__timestamp"
        v-else
        hour="numeric"
        minute="numeric"
        :value="timestamp"
      ></j-timestamp>
    </div>
    <div class="message-item__right-column">
      <div class="message-item__message-info" v-if="showAvatar">
        <j-popover placement="bottom-start">
          <j-text
            slot="trigger"
            :id="username"
            color="black"
            nomargin
            weight="500"
            class="message-item__username"
            >{{ username }}
          </j-text>
          <j-menu slot="content">
            <j-menu-item>Halla</j-menu-item>
          </j-menu>
        </j-popover>
        <j-timestamp
          hour="numeric"
          minute="numeric"
          class="message-item__timestamp"
          :value="timestamp"
        ></j-timestamp>
      </div>
      <div class="message-item__message" v-html="message"></div>
    </div>
  </div>
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

    const mentionElements = document.querySelectorAll(".mention");

    for (const ele of mentionElements) {
      const mention = ele as HTMLElement;
      mention.onclick = () => {
        if (mention.dataset.label?.startsWith("#")) {
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
      };
    }
  },
});
</script>

<style>
.message-item {
  padding: var(--j-space-300) 0;
  font-size: var(--j-font-size-400);
  display: grid;
  gap: var(--j-space-500);
  grid-template-columns: 70px 1fr;
}

.message-item:hover {
  background: hsla(var(--j-color-primary-hue), 50%, 50%, 0.03);
}

.message-item__left-column {
  text-align: right;
}

.message-item__timestamp {
  opacity: 0.5;
  font-size: var(--j-font-size-300);
}

.message-item__right-column {
  flex: 1;
  width: 100%;
}

.message-item__left-column .message-item__timestamp {
  visibility: hidden;
}

.message-item:hover .message-item__left-column .message-item__timestamp {
  visibility: visible;
}

.message-item__message-info {
  display: flex;
  align-items: center;
  margin-bottom: var(--j-space-300);
  gap: var(--j-space-400);
}

.message-item__message > :first-of-type {
  margin-top: 0;
}

.message-item__message > :last-of-type {
  margin-bottom: 0;
}

.message-item__message .mention {
  cursor: pointer;
  padding: 2px var(--j-space-200);
  border-radius: var(--j-border-radius);
  background: var(--j-color-primary-100);
  color: var(--j-color-primary-700);
}

.message-item__message .mention:hover {
  color: var(--j-color-primary-500);
}
</style>
