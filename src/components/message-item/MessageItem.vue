<template>
  <div class="message-item">
    <div class="message-item__left-column">
      <j-avatar
        class="message-item__avatar"
        @click="handleProfileClick"
        v-if="showAvatar"
        :hash="did"
        :src="profileImg"
      />

      <j-tooltip v-else>
        <j-timestamp
          slot="title"
          :value="timestamp"
          dateStyle="full"
        ></j-timestamp>
        <j-timestamp
          class="message-item__timestamp"
          hour="numeric"
          minute="numeric"
          :value="timestamp"
        ></j-timestamp>
      </j-tooltip>
    </div>
    <div class="message-item__right-column">
      <div class="message-item__message-info" v-if="showAvatar">
        <j-text
          @click="handleProfileClick"
          slot="trigger"
          :id="username"
          color="black"
          nomargin
          weight="500"
          class="message-item__username"
          >{{ username }}
        </j-text>
        <j-tooltip placement="top">
          <j-timestamp
            slot="title"
            :value="timestamp"
            dateStyle="full"
          ></j-timestamp>
          <j-timestamp
            class="message-item__timestamp"
            relative
            :value="timestamp"
          ></j-timestamp>
        </j-tooltip>
      </div>
      <div class="message-item__message" v-html="message"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["mentionClick", "profileClick"],
  props: {
    did: String,
    timestamp: String,
    username: String,
    message: String,
    profileImg: String,
    showAvatar: Boolean,
    openMember: Function,
    openedProfile: Object,
  },
  mounted() {
    const mentionElements = document.querySelectorAll(".mention");

    for (const ele of mentionElements) {
      const mention = ele as HTMLElement;
      mention.onclick = () => {
        this.$emit("mentionClick", mention.dataset);
      };
    }
  },
  methods: {
    handleProfileClick() {
      this.$emit("profileClick", this.did);
    },
  },
});
</script>

<style>
.message-item {
  padding: var(--j-space-300) 0;
  display: grid;
  gap: var(--j-space-500);
  grid-template-columns: 70px 1fr;
}

.message-item__avatar {
  cursor: pointer;
}

.message-item:hover {
  background: hsla(var(--j-color-primary-hue), 50%, 50%, 0.03);
}

.message-item__left-column {
  text-align: right;
}

.message-item__timestamp {
  opacity: 0.5;
  cursor: pointer;
  font-size: var(--j-font-size-300);
}

.message-item__timestamp:hover {
  opacity: 0.8;
  text-decoration: underline;
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

.message-item__message a {
  color: var(--j-color-primary-600);
  text-decoration: underline;
}

.message-item__message .mention:hover {
  color: var(--j-color-primary-500);
}

.message-item__username {
  cursor: pointer;
}

.message-item__username:hover {
  cursor: pointer;
  text-decoration: underline;
}
</style>
