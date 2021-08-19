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
import { ExpressionAndRef, ProfileExpression } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { DynamicScroller, DynamicScrollerItem } from "vue3-virtual-scroller";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";
import { differenceInMinutes, parseISO } from "date-fns";
import MessageItem from "@/components/message-item/MessageItem.vue";
import { Editor } from "@tiptap/vue-3";
import { sortExpressionsByTimestamp } from "@/utils/expressionHelpers";
import { useDataStore } from "@/store/data";

interface UserMap {
  [key: string]: ProfileExpression;
}

interface ExpressionAndRefWithId extends ExpressionAndRef {
  id: string;
}

export default defineComponent({
  emits: ["scrollToBottom", "profileClick", "mentionClick"],
  props: ["channel", "community", "showNewMessagesButton", "profileLanguage"],
  name: "ChannelView",
  components: {
    DynamicScroller,
    DynamicScrollerItem,
    MessageItem,
  },
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore
    }
  },
  data() {
    return {
      noDelayRef: 0,
      currentExpressionPost: "",
      users: {} as UserMap,
      linksWorker: null as null | Worker,
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
      // TODO: Not in use yet
      const messageAmount = this.messages.length;
      if (messageAmount) {
        const lastMessage = this.messages[messageAmount - 1];
        this.loadMessages(lastMessage.expression.timestamp);
      } else {
        this.loadMessages();
      }
    },
    loadMessages(from?: string, to?: string): void {
      // TODO: Not in use yet
      this.dataStore.loadExpressions({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        channelId: this.channel.neighbourhood.perspective.uuid,
      });
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
