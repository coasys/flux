<template>
  <div class="channel-messages">
    <div class="channel-messages__load-more">
      <j-button
        variant="primary"
        v-if="showNewMessagesButton && channel.state.hasNewMessages"
        @click="() => scrollToBottom('smooth')"
      >
        Show new messages
        <j-icon name="arrow-down-short" size="xs" />
      </j-button>
    </div>

    <DynamicScroller
      :items="messages"
      :min-item-size="1"
      class="scroller"
      ref="scrollContainer"
      @scroll="handleScroll"
    >
      <template #before>
        <j-box px="500" py="500">
          <j-flex a="center" j="center" gap="500">
            <j-text color="ui-400" nomargin v-if="isAlreadyFetching">
              🤫 Shhh.. Listening for gossip.
            </j-text>
            <j-button
              v-else
              size="sm"
              variant="subtle"
              @click="loadMoreMessages"
            >
              Look for older messages
            </j-button>
          </j-flex>
        </j-box>
      </template>

      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.expression.data.body]"
          :data-index="index"
        >
          <message-item
            :key="item.expression.signature"
            :did="item.expression.author"
            :showAvatar="showAvatar(index)"
            :message="item.expression.data.body"
            :timestamp="item.expression.timestamp"
            :username="users[item.expression.author]?.['foaf:AccountName']"
            :profileImg="
              users[item.expression.author]?.['schema:image'] &&
              JSON.parse(users[item.expression.author]['schema:image'])[
                'schema:contentUrl'
              ]
            "
            @profileClick="(did) => $emit('profileClick', did)"
            @mentionClick="(dataset) => $emit('mentionClick', dataset)"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import store from "@/store";
import { ExpressionAndRef, ProfileExpression } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";
import { differenceInMinutes, parseISO } from "date-fns";
import MessageItem from "@/components/message-item/MessageItem.vue";
import { Editor } from "@tiptap/vue-3";
import { sortExpressionsByTimestamp } from "@/utils/expressionHelpers";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { isAtBottom } from "@/utils/scroll";

interface UserMap {
  [key: string]: ProfileExpression;
}

interface ExpressionAndRefWithId extends ExpressionAndRef {
  id: string;
}

export default defineComponent({
  name: "ChannelView",
  components: { DynamicScroller, DynamicScrollerItem, MessageItem },
  emits: [
    "scrollToBottom",
    "profileClick",
    "mentionClick",
    "updateLinkWorker",
    "updateExpressionWorker",
    "scrolledToTop",
    "scrolledToBottom",
  ],
  props: [
    "channel",
    "community",
    "profileLanguage",
    "linksWorker",
    "expressionWorker",
  ],
  data() {
    return {
      scrolledToTop: false,
      scrolledToBottom: false,
      previousFetchedTimestamp: null as string | undefined | null,
      noDelayRef: 0,
      currentExpressionPost: "",
      users: {} as UserMap,
      editor: null as Editor | null,
      showList: false,
      showProfile: false,
      showNewMessagesButton: false,
      activeProfile: {} as any,
    };
  },
  beforeRouteUpdate(to, from, next) {
    if (this.channel.neighbourhood) {
      this.saveScrollPos();
    }
    next();
  },
  mounted() {
    this.scrollToLatestPos();
  },
  watch: {
    scrolledToTop: function (isAtTop) {
      if (isAtTop) {
        this.loadMoreMessages();
      }
    },
    scrolledToBottom: function (atBottom) {
      if (atBottom) {
        this.markAsRead();
      }
    },
    "channel.state.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        const container = this.$refs.scrollContainer as any;
        const atBottom = isAtBottom(container.$el);
        if (container) {
          if (atBottom) {
            this.scrollToBottom("smooth");
          } else {
            this.showNewMessagesButton = true;
          }
        }
      }
    },
    messages: {
      handler: function (messages: ExpressionAndRef[]): void {
        if (this.scrolledToBottom) {
          // TODO: Debounce this
          this.scrollToBottom("smooth");
        }
        messages.forEach((msg: ExpressionAndRef) => {
          if (!this.users[msg.expression.author]) {
            this.loadUser(msg.expression.author);
          }
        });
      },
      immediate: true,
    },
  },
  computed: {
    isAlreadyFetching(): boolean {
      if (this.messages.length) {
        const oldestMessage = this.messages[0];
        const from = oldestMessage.expression.timestamp;
        return from === this.previousFetchedTimestamp;
      }
      return true;
    },
    messages(): ExpressionAndRefWithId[] {
      // Sort by desc, because we have column-reverse on chat messages
      return sortExpressionsByTimestamp(
        this.channel?.neighbourhood?.currentExpressionMessages || [],
        "asc"
      ).map((item) => ({ ...item, id: item.expression.proof.signature }));
    },
  },
  methods: {
    markAsRead() {
      store.commit.setHasNewMessages({
        channelId: this.channel.neighbourhood.perspective.uuid,
        value: false,
      });
      this.showNewMessagesButton = false;
    },
    scrollToLatestPos(): void {
      // Next tick waits for everything to be rendered
      //  @ts-ignore
      this.$nextTick(() => {
        const scrollContainer = this.$refs.scrollContainer as any;

        if (this.channel.state.scrollTop === undefined) {
          this.scrollToBottom("auto");
        } else {
          scrollContainer.scrollTop = this.channel.state.scrollTop as number;
        }

        this.scrolledToBottom = isAtBottom(scrollContainer.$el);

        if (this.scrolledToBottom && this.channel.state.hasNewMessages) {
          this.markAsRead();
        }
        if (!this.scrolledToBottom && this.channel.state.hasNewMessages) {
          this.showNewMessagesButton = true;
        }
      });
    },
    saveScrollPos() {
      const channelId = this.channel.neighbourhood.perspective.uuid;
      const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;
      store.commit.setChannelScrollTop({
        channelId: channelId as string,
        value: scrollContainer ? scrollContainer.scrollTop : 0,
      });
    },
    handleScroll(e: any): void {
      this.scrolledToTop = e.target.scrollTop <= 20;
      this.scrolledToBottom = isAtBottom(e.target);
      this.saveScrollPos();
    },
    scrollToBottom(behavior: "smooth" | "auto"): void {
      this.markAsRead();
      const container = this.$refs.scrollContainer as any;
      container.scrollToBottom(behavior);
    },
    showAvatar(index: number): boolean {
      const previousExpression = this.messages[index - 1]?.expression;
      const expression = this.messages[index].expression;

      if (!previousExpression || !expression) {
        return true;
      } else {
        return previousExpression.author !== expression.author
          ? true
          : previousExpression.author === expression.author &&
              differenceInMinutes(
                parseISO(expression.timestamp),
                parseISO(previousExpression.timestamp)
              ) >= 2;
      }
    },
    async loadUser(did: string) {
      let profileLang = this.profileLanguage;
      const dataExp = await getProfile(profileLang, did);
      if (dataExp) {
        const { data } = dataExp;
        this.users[did] = data.profile;
      }
    },
    loadMoreMessages(): void {
      const messageAmount = this.messages.length;
      if (messageAmount) {
        if (!this.isAlreadyFetching) {
          const oldestMessage = this.messages[0];
          this.loadMessages(oldestMessage.expression.timestamp);
        }
      } else {
        this.loadMessages();
      }
    },
    async loadMessages(from?: string, to?: string) {
      if (this.linksWorker) {
        this.linksWorker!.terminate();
      }
      if (this.expressionWorker) {
        this.expressionWorker!.terminate();
      }

      const { linksWorker, expressionWorker } =
        await store.dispatch.loadExpressions({
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          channelId: this.channel.neighbourhood.perspective.uuid,
          expressionWorker: new Worker("pollingWorker.js"),
        });

      this.$emit("updateLinkWorker", linksWorker);
      this.$emit("updateExpressionWorker", expressionWorker);

      this.previousFetchedTimestamp = from;
    },
  },
});
</script>

<style scoped>
.channel-messages {
  background: var(--app-channel-bg-color);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.channel-messages__load-more {
  position: absolute;
  top: var(--j-space-1000);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
</style>
