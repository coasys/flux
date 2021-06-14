<template>
  <div class="channel-view">
    <header class="channel-view__header">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
    </header>
    <div class="channel-view__main">
      <div class="channel-view__load-more">
        <j-button @click="loadMoreMessages">Load more messages</j-button>
      </div>
      <dynamic-scroller
        :items="messageList"
        :min-item-size="100"
        class="channelView__messages"
        ref="messagesContainer"
      >
        <template v-slot="{ item, index, active }">
          <dynamic-scroller-item
            :item="item"
            :active="active"
            :data-index="index"
          >
            <j-message-item
              :hideuser="item.hideUser"
              :timestamp="item.timestamp"
            >
              <j-avatar
                :src="require('@/assets/images/junto_app_icon.png')"
                slot="avatar"
                initials="P"
              />
              <span slot="username">Username</span>
              <div slot="message">
                <span v-html="item.message"></span>
              </div>
            </j-message-item>
          </dynamic-scroller-item>
        </template>
      </dynamic-scroller>
    </div>
    <footer class="channel-view__footer">
      <j-editor
        @keydown.enter="
          (e) =>
            !e.shiftKey &&
            createDirectMessage({ body: e.target.value, background: [''] })
        "
        :value="currentExpressionPost"
        @change="(e) => (currentExpressionPost = e.target.value)"
      ></j-editor>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { chatMessageRefreshDuration } from "@/core/juntoTypes";
import { ChannelState, CommunityState } from "@/store";
import Expression from "@perspect3vism/ad4m/Expression";
import { JuntoShortForm } from "@/core/juntoTypes";

interface ChatItem {
  id: string;
  authorId?: string;
  timestamp?: string;
  message?: Expression;
  hideUser?: boolean;
}

export default defineComponent({
  data() {
    return {
      noDelayRef: 0,
      currentExpressionPost: {},
    };
  },
  mounted() {
    console.log("Current mounted channel", this.channel);
    this.scrollToBottom();
    /* TODO: Show button only when we scrolled to top
    document.addEventListener("scroll", (e) => {
      this.isScrolledToTop = window.scrollY > 10;
    });
    */
  },
  onUnmounted() {
    if (this.noDelayRef) {
      clearInterval(this.noDelayRef);
    }
  },
  watch: {
    "$route.params.channelId": {
      handler: function (params: string) {
        if (this.noDelayRef) {
          clearInterval(this.noDelayRef);
        }
        this.startLoop(params);
      },
      immediate: true,
    },
  },
  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
    channel(): ChannelState {
      const { channelId, communityId } = this.$route.params;
      return this.$store.getters.getChannel({ channelId, communityId });
    },
    messageList(): Array<ChatItem> {
      const sortedMessages = [...this.channel.currentExpressionMessages].sort(
        (a, b) =>
          new Date(a.expression.timestamp).getTime() -
          new Date(b.expression.timestamp).getTime()
      );

      return sortedMessages.reduce((acc: any, item: any, index: number) => {
        const previousItem = acc[index - 1];
        return [
          ...acc,
          {
            id: item.expression.timestamp,
            authorId: item.expression.author.did,
            timestamp: item.expression.timestamp,
            message: JSON.parse(item.expression.data).body,
            hideUser: item.expression.author.did === previousItem?.authorId,
          },
        ];
      }, []);
    },
  },
  methods: {
    startLoop(communityId: string) {
      clearInterval(this.noDelayRef);
      if (communityId) {
        console.log("Running get channels loop");
        const test = this.noDelaySetInterval(async () => {
          this.loadMessages();
        }, chatMessageRefreshDuration);

        //@ts-ignore
        this.noDelayRef = test;
      }
    },
    noDelaySetInterval(func: () => void, interval: number) {
      func();

      return setInterval(func, interval);
    },
    loadMoreMessages() {
      const messageAmount = this.messageList.length;
      if (messageAmount) {
        const lastMessage = this.messageList[messageAmount - 1];
        this.loadMessages(lastMessage.timestamp);
      } else {
        this.loadMessages();
      }
    },
    loadMessages(from?: string, to?: string): void {
      this.$store.dispatch("loadExpressions", {
        from,
        to,
        communityId: this.$route.params.communityId,
        channelId: this.$route.params.channelId,
      });
    },
    async createDirectMessage(message: JuntoShortForm) {
      this.currentExpressionPost = "";
      this.$store
        .dispatch("createExpression", {
          languageAddress: this.community.expressionLanguages[0]!,
          content: message,
          perspective: this.$route.params.channelId.toString(),
        })
        .then(() => {
          setTimeout(this.scrollToBottom, 300);
        });
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      //@ts-ignore
      container.scrollTop = container.scrollHeight;
    },
  },

  components: {
    DynamicScroller,
    DynamicScrollerItem,
  },
});
</script>

<style scoped>
.channel-view {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.channel-view__header {
  position: sticky;
  top: 0;
  height: 40px;
  padding: var(--j-space-500);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--j-color-ui-100);
  background: var(--j-color-white);
  z-index: 1;
}
.channel-view__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.channel-view__load-more {
  position: absolute;
  top: var(--j-space-1000);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.channel-view__footer {
  background: var(--j-color-white);
  position: sticky;
  bottom: 0;
  padding: var(--j-space-300);
}
</style>
