<template>
  <div class="channel-messages">
    <div class="channel-messages__load-more">
      <j-button
        variant="primary"
        v-if="showNewMessagesButton && channel.state.hasNewMessages"
        @click="$emit('scrollToBottom', 'smooth')"
      >
        Show new messages
        <j-icon name="arrow-down-short" size="xs" />
      </j-button>
    </div>

    <j-box px="500" py="500">
      <j-flex a="center" j="center" gap="500">
        <j-text color="ui-400" nomargin v-if="isAlreadyFetching">
          🤫 Shhh.. Listening for gossip.
        </j-text>
        <j-button v-else size="sm" variant="subtle" @click="loadMoreMessages">
          Look for older messages
        </j-button>
      </j-flex>
    </j-box>

    <message-item
      v-for="(item, index) in messages"
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

interface UserMap {
  [key: string]: ProfileExpression;
}

interface ExpressionAndRefWithId extends ExpressionAndRef {
  id: string;
}

export default defineComponent({
  emits: [
    "scrollToBottom",
    "profileClick",
    "mentionClick",
    "updateLinkWorker",
    "updateExpressionWorker",
  ],
  props: [
    "channel",
    "community",
    "showNewMessagesButton",
    "profileLanguage",
    "linksWorker",
    "scrolledToBottom",
    "scrolledToTop",
  ],
  name: "ChannelView",
  components: { MessageItem },
  data() {
    return {
      previousFetchedTimestamp: null as string | undefined | null,
      noDelayRef: 0,
      currentExpressionPost: "",
      users: {} as UserMap,
      editor: null as Editor | null,
      showList: false,
      showProfile: false,
      activeProfile: {} as any,
    };
  },
  watch: {
    scrolledToTop: function (isAtTop) {
      if (isAtTop) {
        this.loadMoreMessages();
      }
    },
    messages: {
      handler: async function (messages: ExpressionAndRef[]) {
        if (this.scrolledToBottom) {
          // TODO: Debounce this
          this.$emit("scrollToBottom");
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

      const { linksWorker, expressionWorker } =
        await store.dispatch.loadExpressions({
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          channelId: this.channel.neighbourhood.perspective.uuid,
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
}

.channel-messages__load-more {
  position: absolute;
  top: var(--j-space-1000);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
</style>
