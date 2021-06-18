<template>
  <div class="channel-view" ref="scrollContainer">
    <header class="channel-view__header">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
    </header>

    <div class="channel-view__main">
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
          :src="
            users[message.authorId]?.profile['schema:image']
              ? JSON.parse(users[message.authorId].profile['schema:image'])[
                  'schema:contentUrl'
                ]
              : require('@/assets/images/avatar-placeholder.png')
          "
          slot="avatar"
          initials="P"
        />
        <span slot="username">{{
          users[message.authorId]?.profile["foaf:AccountName"]
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
import { JuntoShortForm } from "@/core/juntoTypes";
import Expression from "@perspect3vism/ad4m/Expression";
import { ChannelState, CommunityState, ExpressionTypes } from "@/store";
import { getProfile } from "@/utils/profileHelpers";
import { chatMessageRefreshDuration } from "@/core/juntoTypes";
import sleep from "@/utils/sleep";

interface Message {
  id: string;
  authorId: string;
  date?: Date | string | number;
  message?: Expression;
  hideUser?: boolean;
  timestamp: string;
}

interface UserMap {
  [key: string]: any;
}

export default defineComponent({
  data() {
    return {
      noDelayRef: 0,
      currentExpressionPost: {},
      unsortedMessages: [],
      users: {} as UserMap,
    };
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
    messages(): any[] {
      const sortedMessages = [...this.channel.currentExpressionMessages].sort(
        (a: any, b: any) => {
          return (
            new Date(a.expression.timestamp).getTime() -
            new Date(b.expression.timestamp).getTime()
          );
        }
      );

      return sortedMessages.reduce(
        (acc: Message[], item: any, index: number) => {
          this.loadUser(item.expression.author.did);
          const prevItem = acc[index - 1];
          return [
            ...acc,
            {
              id: item.expression.timestamp,
              authorId: item.expression.author.did,
              timestamp: item.expression.timestamp,
              message: JSON.parse(item.expression.data).body,
              hideUser: prevItem
                ? prevItem.authorId === item.expression.author.did
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
    profileLanguage(): string {
      const profileLang = this.community?.typedExpressionLanguages.find(
        (t) => t.expressionType === ExpressionTypes.ProfileExpression
      );
      return profileLang!.languageAddress;
    },
  },
  methods: {
    async loadUser(did: string) {
      let profileLang = this.profileLanguage;
      const { data } = await getProfile(profileLang, did);
      this.users[did] = data;
    },
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
      const container = this.$refs.scrollContainer;
      if (container) {
        //@ts-ignore
        container.scrollTop = container.scrollHeight;
      }
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
