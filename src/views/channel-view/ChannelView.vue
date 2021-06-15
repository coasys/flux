<template>
  <div class="channel-view">
    <header class="channel-view__header">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
    </header>
    <div class="channel-view__main" ref="messagesContainer">
      <div class="channel-view__load-more">
        <j-button @click="loadMoreMessages">Load more messages</j-button>
      </div>

      <j-message-item
        v-for="message in messages"
        :key="message.id"
        :hideuser="message.hideUser"
        :timestamp="message.timestamp"
      >
        <j-avatar
          v-if="message.user"
          :src="
            message.user.data.profile['schema:image']
              ? JSON.parse(message.user.data.profile['schema:image'])[
                  'schema:contentUrl'
                ]
              : require('@/assets/images/avatar-placeholder.png')
          "
          slot="avatar"
          initials="P"
        />
        <span v-if="message.user" slot="username">{{
          message.user.data.profile["foaf:AccountName"]
        }}</span>
        <div slot="message">
          <span v-html="message.message"></span>
        </div>
      </j-message-item>
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
import { defineComponent } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { JuntoShortForm } from "@/core/juntoTypes";
import Expression from "@perspect3vism/ad4m/Expression";
import {
  ChannelState,
  Profile,
  CommunityState,
  ExpressionTypes,
} from "@/store";
import { getProfile } from "@/utils/profileHelpers";
import { chatMessageRefreshDuration } from "@/core/juntoTypes";
import sleep from "@/utils/sleep";

interface Message {
  id: string;
  authorId: string;
  user: Profile;
  date?: Date | string | number;
  message?: Expression;
  hideUser?: boolean;
  timestamp: string;
}

export default defineComponent({
  data() {
    return {
      noDelayRef: 0,
      currentExpressionPost: {},
      unsortedMessages: [],
    };
  },
  watch: {
    "channel.currentExpressionMessages": {
      handler: async function (expressions) {
        const profileLang = this.community?.typedExpressionLanguages.find(
          (t) => t.expressionType === ExpressionTypes.ProfileExpression
        );

        if (profileLang) {
          this.unsortedMessages = await Promise.all(
            expressions.map(async (item: any) => {
              return {
                user: null,
                id: item.expression.timestamp,
                authorId: item.expression.author.did,
                timestamp: item.expression.timestamp,
                message: JSON.parse(item.expression.data).body,
              };
            }, [])
          );
        }
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    console.log("Current mounted channel", this.channel);
    this.scrollToBottom();
    this.startLoop(this.community.perspective);
    /* TODO: Show button only when we scrolled to top
    document.addEventListener("scroll", (e) => {
      this.isScrolledToTop = window.scrollY > 10;
    });
    */
  },
  computed: {
    messages(): Message[] {
      const sortedMessages = [...this.unsortedMessages].sort(
        (a: Message, b: Message) => {
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      );

      return sortedMessages.reduce(
        (acc: Message[], message: Message, index: number) => {
          const prevMessage = acc[index - 1];
          return [
            ...acc,
            {
              ...message,
              hideUser: prevMessage
                ? prevMessage.authorId === message.authorId
                : false,
            },
          ];
        },
        []
      );
    },
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
    channel(): ChannelState {
      const { channelId, communityId } = this.$route.params;
      return this.$store.getters.getChannel({ channelId, communityId });
    },
  },
  methods: {
    async startLoop(communityId: string) {
      if (communityId) {
        console.log("Running get channels loop");
        await this.$store.dispatch("loadExpressions", {
          communityId: this.$route.params.communityId,
          channelId: this.$route.params.channelId,
        });
        await sleep(chatMessageRefreshDuration);
        this.startLoop(communityId);
      }
    },
    loadMoreMessages() {
      const messageAmount = this.messages.length;
      if (messageAmount) {
        const lastMessage = this.messages[messageAmount - 1];
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
      console.log(
        "scroll to bottom",
        //@ts-ignore
        container.scrollTop,
        //@ts-ignore
        container.scrollHeight
      );
      //@ts-ignore
      container.scrollTop = container.scrollHeight;
    },
  },

  components: {},
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
