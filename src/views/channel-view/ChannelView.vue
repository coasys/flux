<template>
  <div class="channel-view" @scroll="handleScroll" ref="scrollContainer">
    <header class="channel-view__header">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
    </header>

    <div class="channel-view__main">
      <div class="channel-view__load-more">
        <j-button
          variant="primary"
          v-if="showNewMessagesButton && channel.hasNewMessages"
          @click="scrollToBottom('smooth')"
        >
          Show new messages
          <j-icon name="arrow-down-short" size="xs" />
        </j-button>
      </div>

      <DynamicScroller
        v-if="messages.length"
        ref="scroller"
        :items="messages"
        :min-item-size="2"
      >
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[item.message, item.timestamp]"
            :data-index="index"
            :data-active="active"
            class="message"
          >
            <j-message-item
              :hideuser="!showAvatar(index)"
              :timestamp="item.timestamp"
            >
              <j-avatar
                :src="
                  users[item.did]?.profile['schema:image']
                    ? JSON.parse(users[item.did].profile['schema:image'])[
                        'schema:contentUrl'
                      ]
                    : require('@/assets/images/avatar-placeholder.png')
                "
                slot="avatar"
                initials="P"
              />
              <span slot="username">{{
                users[item.did]?.profile["foaf:AccountName"]
              }}</span>
              <div slot="message">
                <span v-html="item.message"></span>
              </div>
            </j-message-item>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
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
import {
  ChannelState,
  CommunityState,
  ExpressionAndRef,
  ExpressionTypes,
} from "@/store";
import { getProfile } from "@/utils/profileHelpers";
import { chatMessageRefreshDuration } from "@/core/juntoTypes";
import sleep from "@/utils/sleep";
import { DynamicScroller, DynamicScrollerItem } from "vue3-virtual-scroller";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";
import { differenceInMinutes, parseISO } from "date-fns";

interface Message {
  id: string;
  did: string;
  date?: Date | string | number;
  message?: Expression;
  hideUser?: boolean;
  timestamp: string;
}

interface UserMap {
  [key: string]: any;
}

export default defineComponent({
  name: "ChannelView",
  components: { DynamicScroller, DynamicScrollerItem },
  data() {
    return {
      lastScrollTop: 0,
      cachedChannelId: "",
      showNewMessagesButton: false,
      noDelayRef: 0,
      currentExpressionPost: {},
      unsortedMessages: [],
      users: {} as UserMap,
    };
  },

  mounted() {
    this.cachedChannelId = this.$route.params.channelId as string;
    setTimeout(() => {
      this.scrollToBottom("auto");
    }, 300);
    this.startLoop(this.community.perspective);
  },
  watch: {
    "$route.params.channelId": function (id) {
      console.log("route changed");
      if (id === this.cachedChannelId) {
        console.log("trying to go back to scroll pos");
        const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;
        scrollContainer.scrollTop = this.lastScrollTop as number;
      }
    },
    "channel.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        // If this channel is not in view, and only kept alive
        // Show new messages button, so when you open the channel
        // Again the button will be there
        if (this.$route.params.channelId !== this.channel.perspective) {
          this.showNewMessagesButton = true;
          return;
        }

        const container = this.$refs.scrollContainer as HTMLDivElement;
        if (!container) return;

        const isAtBottom =
          container.scrollHeight - window.innerHeight === container.scrollTop;

        if (isAtBottom) {
          this.scrollToBottom("smooth");
        } else {
          this.showNewMessagesButton = true;
        }
      }
    },
  },
  computed: {
    messages(): any[] {
      const sortedMessages = Object.values(
        this.channel.currentExpressionMessages
      ).sort((a: ExpressionAndRef, b: ExpressionAndRef) => {
        return (
          new Date(a.expression.timestamp).getTime() -
          new Date(b.expression.timestamp).getTime()
        );
      });

      //Note; code below will break once we add other expression types since we try to extract body from exp data
      return sortedMessages.reduce((acc: Message[], item: ExpressionAndRef) => {
        this.loadUser(item.expression.author.did);
        return [
          ...acc,
          {
            id: item.expression.proof.signature,
            did: item.expression.author.did,
            timestamp: item.expression.timestamp,
            //@ts-ignore
            message: item.expression.data.body,
          },
        ];
      }, []);
    },
    community(): CommunityState {
      const { communityId } = this.$route.params;

      return this.$store.getters.getCommunity(communityId);
    },
    channel(): ChannelState {
      const cachedChannelId = this.cachedChannelId;
      const { communityId, channelId } = this.$route.params;
      if (!cachedChannelId) {
        return this.$store.getters.getChannel({ channelId, communityId });
      } else {
        return this.$store.getters.getChannel({
          channelId: cachedChannelId,
          communityId,
        });
      }
    },
    profileLanguage(): string {
      const profileLang = this.community?.typedExpressionLanguages.find(
        (t) => t.expressionType === ExpressionTypes.ProfileExpression
      );
      return profileLang!.languageAddress;
    },
  },
  methods: {
    handleScroll(e: any) {
      this.lastScrollTop = e.target.scrollTop;
      const isAtBottom =
        e.target.scrollHeight - window.innerHeight === e.target.scrollTop;
      if (isAtBottom) {
        this.showNewMessagesButton = false;
      }
    },
    showAvatar(index: number): boolean {
      const previousMessage = this.messages[index - 1];
      const message = this.messages[index];
      if (!previousMessage || !message) {
        return true;
      }
      if (previousMessage.did !== message.did) {
        return true;
      }
      return (
        previousMessage.did === message.did &&
        differenceInMinutes(
          parseISO(message.timestamp),
          parseISO(previousMessage.timestamp)
        ) >= 2
      );
    },
    async loadUser(did: string) {
      let profileLang = this.profileLanguage;
      const dataExp = await getProfile(profileLang, did);
      if (dataExp) {
        const { data } = dataExp;
        this.users[did] = data;
      }
    },
    async startLoop(communityId: string) {
      if (communityId) {
        console.log("Running get channels messages loop");
        let hasNewer = await this.$store.dispatch("loadExpressions", {
          communityId: this.$route.params.communityId,
          channelId: this.$route.params.channelId,
        });
        if (hasNewer) {
          this.$store.commit("setNewMessages", {
            channelId: this.channel.perspective,
            value: true,
          });
        }
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
      const escapedMessage = message.body.replace(/( |<([^>]+)>)/gi, "");

      this.currentExpressionPost = "";

      if (escapedMessage) {
        this.$store.dispatch("createExpression", {
          languageAddress: this.community.expressionLanguages[0]!,
          content: message,
          perspective: this.$route.params.channelId.toString(),
        });
      }
    },
    scrollToBottom(behavior: "smooth" | "auto") {
      const container = this.$refs.scrollContainer as HTMLDivElement;
      if (container) {
        this.$nextTick(() => {
          // If we scroll to the bottom we have seen all messages
          this.$store.commit("setNewMessages", {
            channelId: this.channel.perspective,
            value: false,
          });

          this.showNewMessagesButton = false;

          setTimeout(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior,
            });
          }, 10);
        });
      }
    },
  },
});
</script>

<style scoped>
.message {
  min-height: 32px;
}

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
  border-bottom: 1px solid var(--j-border-color);
  background: var(--app-channel-bg-color);
  z-index: 1;
}
.channel-view__main {
  background: var(--app-channel-bg-color);
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
  background: var(--app-channel-bg-color);
  position: sticky;
  bottom: 0;
  padding: var(--j-space-300);
}
</style>
