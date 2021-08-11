<template>
  <div class="channel-view__main">
    <div class="channel-view__load-more">
      <j-button
        variant="primary"
        v-if="showNewMessagesButton && channel.state.hasNewMessages"
        @click="$emit('scrollToBottom', 'smooth')"
      >
        Show new messages
        <j-icon name="arrow-down-short" size="xs" />
      </j-button>
    </div>
    <div class="channel-view__load-more">
      <j-button variant="primary" v-if="loadMoreBtn" @click="loadMoreMessages">
        Load more
        <j-icon name="arrow-up-short" size="xs" />
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
          :size-dependencies="[
            item.expression.data.body,
            item.expression.timestamp,
          ]"
          :data-index="index"
          :data-active="active"
          class="message"
        >
          <message-item
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
import { DynamicScroller, DynamicScrollerItem } from "vue3-virtual-scroller";
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
  emits: ["scrollToBottom", "profileClick", "mentionClick", "updateLinkWorker"],
  props: [
    "channel",
    "community",
    "showNewMessagesButton",
    "profileLanguage",
    "loadMoreBtn",
    "linksWorker",
  ],
  name: "ChannelView",
  components: {
    DynamicScroller,
    DynamicScrollerItem,
    MessageItem,
  },
  data() {
    return {
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
    messages: {
      handler: async function (messages: ExpressionAndRef[]) {
        messages.forEach((msg: ExpressionAndRef) => {
          this.loadUser(msg.expression.author);
        });
      },
      immediate: true,
    },
  },
  computed: {
    messages(): ExpressionAndRefWithId[] {
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
        const lastMessage = this.messages[0];
        this.loadMessages(lastMessage.expression.timestamp);
      } else {
        this.loadMessages();
      }
    },
    async loadMessages(from?: string, to?: string) {
      if (this.linksWorker) {
        this.linksWorker!.terminate();
      }

      const { linksWorker } = await store.dispatch.loadExpressions({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        channelId: this.channel.neighbourhood.perspective.uuid,
      });

      this.$emit("updateLinkWorker", linksWorker);
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

#profileCard {
  position: fixed;
  opacity: 0;
  z-index: -100;
}
.background {
  height: 100vh;
  width: 100vw;
  background: transparent;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10;
}
.profileCard__container {
  background-color: var(--j-color-white);
  padding: var(--j-space-400);
  border-radius: 10px;
}
</style>
