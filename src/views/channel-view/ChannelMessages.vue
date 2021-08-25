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
      :class="{ hidden: !hasMounted }"
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
              @click="$emit('loadMore')"
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
            :username="users[item.expression.author]?.username"
            :profileImg="users[item.expression.author]?.profilePicture"
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
import { ExpressionAndRef, Profile } from "@/store/types";
import { getProfile, parseProfile } from "@/utils/profileHelpers";
import { differenceInMinutes, parseISO } from "date-fns";
import MessageItem from "@/components/message-item/MessageItem.vue";
import { Editor } from "@tiptap/vue-3";
import { useDataStore } from "@/store/data";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { isAtBottom } from "@/utils/scroll";

interface UserMap {
  [key: string]: Profile;
}

export default defineComponent({
  name: "ChannelView",
  components: {
    MessageItem,
    DynamicScroller,
    DynamicScrollerItem,
  },
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  emits: [
    "scrollToBottom",
    "profileClick",
    "mentionClick",
    "updateLinkWorker",
    "updateExpressionWorker",
    "loadMore",
  ],
  props: [
    "channel",
    "community",
    "profileLanguage",
    "linksWorker",
    "expressionWorker",
    "messages",
    "isAlreadyFetching",
  ],
  data() {
    return {
      hasMounted: false,
      scrolledToTop: false,
      scrolledToBottom: false,
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
    // TODO: Why do we need timeout here?
    // Without virtual-scroller it worked
    setTimeout(() => {
      this.scrollToLatestPos();
      this.hasMounted = true;
    }, 0);
  },
  watch: {
    scrolledToTop: function (isAtTop) {
      if (isAtTop) {
        this.$emit("loadMore");
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
  methods: {
    markAsRead() {
      this.dataStore.setHasNewMessages({
        channelId: this.channel.neighbourhood.perspective.uuid,
        value: false,
      });
      this.showNewMessagesButton = false;
    },
    scrollToLatestPos(): void {
      const scrollContainer = this.$refs.scrollContainer as any;

      if (this.channel.state.scrollTop === undefined) {
        this.scrollToBottom("auto");
      } else {
        console.log("scrolling to", this.channel.state.scrollTop);
        scrollContainer.$el.scrollTop = this.channel.state.scrollTop as number;
      }

      this.scrolledToBottom = isAtBottom(scrollContainer.$el);

      if (this.scrolledToBottom && this.channel.state.hasNewMessages) {
        this.markAsRead();
      }
      if (!this.scrolledToBottom && this.channel.state.hasNewMessages) {
        this.showNewMessagesButton = true;
      }
    },
    saveScrollPos() {
      const channelId = this.channel.neighbourhood.perspective.uuid;
      const scrollContainer = this.$refs.scrollContainer as any;
      this.dataStore.setChannelScrollTop({
        channelId: channelId as string,
        value: scrollContainer ? scrollContainer.$el.scrollTop : undefined,
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
        this.users[did] = parseProfile(data.profile);
      }
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

.hidden {
  opacity: 0;
}
</style>
