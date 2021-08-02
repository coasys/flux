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
            :username="users[item.expression.author]['foaf:AccountName']"
            :profileImg="
              users[item.expression.author]['schema:image'] &&
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
import {
  ExpressionAndRef,
  ExpressionTypes,
  ProfileExpression,
} from "@/store/types";
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
  emits: ["scrollToBottom", "profileClick", "mentionClick"],
  props: ["channel", "community", "showNewMessagesButton"],
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
    profileLanguage(): string {
      const profileLang =
        this.community.neighbourhood.typedExpressionLanguages.find(
          (t) => t.expressionType === ExpressionTypes.ProfileExpression
        );
      return profileLang!.languageAddress;
    },
  },
  methods: {
    handleEditorChange(e: any) {
      //console.log(e.target.json);
      this.currentExpressionPost = e.target.value;
    },
    handleProfileClick(did: string) {
      this.showProfile = true;
      this.activeProfile = this.community.neighbourhood.members.find(
        (m) => m.author === did
      );
    },
    handleMentionClick(dataset: { label: string; id: string }) {
      const { label, id } = dataset;
      if (label?.startsWith("#")) {
        this.$router.push({
          name: "channel",
          params: {
            channelId: id,
            communityId: this.community.neighbourhood.perspective.uuid,
          },
        });
      }
      if (label?.startsWith("@")) {
        this.showProfile = true;
        this.activeProfile = this.community.neighbourhood.members.find(
          (m) => m.author === `did:key:${id}`
        );
      }
    },
    editorinit(e: any) {
      this.editor = e.detail.editorInstance;
    },
    changeShowList(e: any) {
      this.showList = e.detail.showSuggestions;
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
      console.log(dataExp);
      if (dataExp) {
        const { data } = dataExp;
        this.users[did] = data.profile;
      }
    },
    loadMoreMessages() {
      const messageAmount = this.messages.length;
      if (messageAmount) {
        const lastMessage = this.messages[messageAmount - 1];
        this.loadMessages(lastMessage.expression.timestamp);
      } else {
        this.loadMessages();
      }
    },
    loadMessages(from?: string, to?: string): void {
      let fromDate;
      if (from) {
        fromDate = new Date(from);
      } else {
        fromDate = undefined;
      }
      let toDate;
      if (to) {
        toDate = new Date(to);
      } else {
        toDate = undefined;
      }
      store.dispatch.loadExpressions({
        from: fromDate,
        to: toDate,
        channelId: this.channel.neighbourhood.perspective.uuid,
      });
    },
    async createDirectMessage(message: string) {
      const escapedMessage = message.replace(/( |<([^>]+)>)/gi, "");

      this.currentExpressionPost = "";

      if (escapedMessage) {
        store.dispatch.createExpression({
          languageAddress:
            this.channel.neighbourhood.typedExpressionLanguages.find(
              (t) => t.expressionType === ExpressionTypes.ShortForm
            )!.languageAddress,
          content: { body: message, background: [""] },
          perspective: this.channel.neighbourhood.perspective.uuid as string,
        });
      }
    },
    scrollToBottom(behavior: "smooth" | "auto") {
      const container = this.$refs.scrollContainer as HTMLDivElement;
      if (container) {
        this.$nextTick(() => {
          this.markAsRead();

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
