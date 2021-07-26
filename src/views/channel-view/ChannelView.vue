<template>
  <div class="channel-view" @scroll="handleScroll" ref="scrollContainer">
    <header class="channel-view__header">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{
        channel.neighbourhood.name
      }}</j-text>
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
            <message-item
              :did="item.did"
              :showAvatar="showAvatar(index)"
              :message="item.message"
              :timestamp="item.timestamp"
              :username="users[item.did]?.profile['foaf:AccountName']"
              :profileImg="
                users[item.did]?.profile['schema:image'] &&
                JSON.parse(users[item.did].profile['schema:image'])[
                  'schema:contentUrl'
                ]
              "
              @profileClick="handleProfileClick"
              @mentionClick="handleMentionClick"
            />
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>
    <footer class="channel-view__footer">
      <j-editor
        @send="(e) => createDirectMessage(e.target.value)"
        autofocus
        :placeholder="`Write to #${channel.neighbourhood.name}`"
        :value="currentExpressionPost"
        @change="handleEditorChange"
        @onsuggestionlist="changeShowList"
        @editorinit="editorinit"
        :mentions="items"
      ></j-editor>
    </footer>
    <j-modal
      size="xs"
      :open="showProfile"
      @toggle="(e) => (showProfile = e.target.open)"
    >
      <j-flex a="center" direction="column" gap="500">
        <j-avatar
          style="--j-avatar-size: 100px"
          :hash="activeProfile?.author"
          :src="
            activeProfile?.data?.profile['schema:image']
              ? JSON.parse(activeProfile?.data?.profile['schema:image'])[
                  'schema:contentUrl'
                ]
              : null
          "
        />
        <j-text variant="heading-sm">{{
          activeProfile?.data?.profile["foaf:AccountName"]
        }}</j-text>
      </j-flex>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import store from "@/store";
import { Expression } from "@perspect3vism/ad4m-types";
import {
  ChannelState,
  CommunityState,
  ExpressionAndRef,
  ExpressionTypes,
} from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { DynamicScroller, DynamicScrollerItem } from "vue3-virtual-scroller";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";
import { differenceInMinutes, parseISO } from "date-fns";
import MessageItem from "@/components/message-item/MessageItem.vue";
import { Editor } from "@tiptap/vue-3";

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

interface MentionTrigger {
  name: string;
  id: string;
  trigger: string;
}

export default defineComponent({
  name: "ChannelView",
  components: { DynamicScroller, DynamicScrollerItem, MessageItem },
  data() {
    return {
      showNewMessagesButton: false,
      noDelayRef: 0,
      currentExpressionPost: "",
      unsortedMessages: [],
      users: {} as UserMap,
      linksWorker: null as null | Worker,
      editor: null as Editor | null,
      showList: false,
      showProfile: false,
      activeProfile: {} as any,
    };
  },
  async beforeRouteUpdate(to, from, next) {
    const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;
    store.commit.setChannelScrollTop({
      channelId: from.params.channelId as string,
      value: scrollContainer.scrollTop,
    });

    if (this.linksWorker) {
      this.linksWorker!.terminate();
    }

    next();
  },
  watch: {
    $route: {
      handler: async function (to) {
        if (!to.params.channelId) return;

        const { linksWorker } = await store.dispatch.loadExpressions({
          channelId: to.params.channelId,
        });

        this.linksWorker = linksWorker;

        store.commit.setCurrentChannelId({
          communityId: to.params.communityId,
          channelId: to.params.channelId,
        });

        // TODO: On first mount view takes too long to render
        // So we don't have the full height to scroll to the right place
        this.scrollToLatestPos();
      },
      immediate: true,
    },
    "channel.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        // If this channel is not in view, and only kept alive
        // show new messages button, so when you open the channel
        // again the button will be there
        if (
          this.$route.params.channelId !==
          this.channel.neighbourhood.perspective.uuid
        ) {
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
    memberMentions(): MentionTrigger[] {
      return this.community.neighbourhood.members.map(
        (m) =>
          ({
            name: (m.data as any).profile["foaf:AccountName"],
            id: m.author.replace("did:key:", ""),
            trigger: "@",
          } as MentionTrigger)
      );
    },
    channelMentions(): MentionTrigger[] {
      return store.getters
        .getChannelNeighbourhoods(this.community.neighbourhood.perspective.uuid)
        .map((channel) => {
          return {
            name: channel.name,
            id: channel.perspective.uuid,
            trigger: "#",
          } as MentionTrigger;
        });
    },
    messages(): any[] {
      const sortedMessages = Object.values(
        this.channel.neighbourhood.currentExpressionMessages
      ).sort((a, b) => {
        return (
          new Date(a.expression.timestamp).getTime() -
          new Date(b.expression.timestamp).getTime()
        );
      });

      //Note; code below will break once we add other expression types since we try to extract body from exp data
      return sortedMessages.reduce((acc: Message[], item: ExpressionAndRef) => {
        this.loadUser(item.expression.author);
        return [
          ...acc,
          {
            id: item.expression.proof.signature,
            did: item.expression.author,
            timestamp: item.expression.timestamp,
            //@ts-ignore
            message: item.expression.data.body,
          },
        ];
      }, []);
    },
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return store.getters.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const { channelId } = this.$route.params;
      return store.getters.getChannel(channelId as string);
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
    scrollToLatestPos() {
      // Next tick waits for everything to be rendered
      this.$nextTick(() => {
        const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;
        if (!scrollContainer) return;
        if (this.channel.state.scrollTop === undefined) {
          this.scrollToBottom("auto");
        } else {
          scrollContainer.scrollTop = this.channel.state.scrollTop as number;
        }

        const isAtBottom =
          scrollContainer.scrollHeight - window.innerHeight ===
          scrollContainer.scrollTop;

        if (isAtBottom && this.channel.state.hasNewMessages) {
          this.markAsRead();
        }
        if (!isAtBottom && this.channel.state.hasNewMessages) {
          this.showNewMessagesButton = true;
        }
      });
    },
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
    markAsRead() {
      store.commit.setHasNewMessages({
        channelId: this.channel.neighbourhood.perspective.uuid,
        value: false,
      });
      this.showNewMessagesButton = false;
    },
    handleScroll(e: any) {
      const isAtBottom =
        e.target.scrollHeight - window.innerHeight === e.target.scrollTop;
      if (isAtBottom) {
        this.markAsRead();
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
    items(trigger: string, query: string) {
      let list = [];

      if (trigger === "@") {
        list = this.memberMentions;
      } else {
        list = this.channelMentions;
      }

      return list
        .filter((item) =>
          item.name.toLowerCase().startsWith(query.toLowerCase())
        )
        .slice(0, 5);
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
              (t) => t.expressionType === ExpressionTypes.ProfileExpression
            )!.languageAddress,
          content: { body: message, background: [""] },
          perspective: this.channel.neighbourhood.perspective.uuid.toString(),
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
.channel-view__header {
  position: sticky;
  top: 0;
  min-height: 74px;
  height: 74px;
  max-height: 74px;
  padding: var(--j-space-400) var(--j-space-500);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--app-channel-border-color);
  background: var(--app-channel-header-bg-color);
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
  border-top: 1px solid var(--app-channel-border-color);
  background: var(--app-channel-footer-bg-color);
  position: sticky;
  padding: var(--j-space-500);
  bottom: 0;
}

j-editor::part(base) {
  border: 0;
}

j-editor::part(toolbar) {
  border: 0;
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
