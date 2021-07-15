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
        :placeholder="`Write to #${channel.name}`"
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
          :hash="activeProfile?.author?.did"
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
import { JuntoShortForm } from "@/core/juntoTypes";
import { Expression } from "@perspect3vism/ad4m";
import {
  ChannelState,
  CommunityState,
  ExpressionAndRef,
  ExpressionTypes,
} from "@/store";
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

export default defineComponent({
  name: "ChannelView",
  components: { DynamicScroller, DynamicScrollerItem, MessageItem },
  data() {
    return {
      cachedChannelId: "",
      chachedCommunityId: "",
      lastScrollTop: 0,
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
  async beforeCreate() {
    const { linksWorker } = await this.$store.dispatch("loadExpressions", {
      communityId: this.$route.params.communityId,
      channelId: this.$route.params.channelId,
    });
    this.linksWorker = linksWorker as Worker;
  },
  mounted() {
    // Set cached id's as Vue has a bug where route params
    // update before the component is unmounted/beforeUnmount
    this.chachedCommunityId = this.$route.params.communityId as string;
    this.cachedChannelId = this.$route.params.channelId as string;

    const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;

    // Next tick waits for everything to be rendered
    this.$nextTick(() => {
      if (this.channel.scrollTop === undefined) {
        this.scrollToBottom("auto");
      } else {
        scrollContainer.scrollTop = this.channel.scrollTop as number;
      }

      const isAtBottom =
        scrollContainer.scrollHeight - window.innerHeight ===
        scrollContainer.scrollTop;

      if (isAtBottom && this.channel.hasNewMessages) {
        this.markAsRead();
      }
      if (!isAtBottom && this.channel.hasNewMessages) {
        this.showNewMessagesButton = true;
      }
    });
  },
  beforeUnmount() {
    if (this.linksWorker) {
      this.linksWorker!.terminate();
    }
    const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;
    this.$store.commit("setChannelScrollTop", {
      communityId: this.community.perspective,
      channelId: this.channel.perspective,
      value: scrollContainer.scrollTop as any,
    });
  },
  watch: {
    "channel.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        // If this channel is not in view, and only kept alive
        // show new messages button, so when you open the channel
        // again the button will be there
        if (this.$route.params.channelId !== this.channel.perspective.uuid) {
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
    memberMentions(): any[] {
      return this.community.members.map((m) => ({
        name: (m.data as any).profile["foaf:AccountName"],
        id: m.author.did.replace("did:key:", ""),
        trigger: "@",
      }));
    },
    channelMentions(): any[] {
      return Object.values(this.community.channels).map((c) => ({
        name: c.name,
        id: c.perspective,
        trigger: "#",
      }));
    },
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

      return this.$store.getters.getCommunity(
        this.chachedCommunityId || communityId
      );
    },
    channel(): ChannelState {
      const { communityId, channelId } = this.$route.params;
      return this.$store.getters.getChannel({
        channelId: this.cachedChannelId || channelId,
        communityId: this.chachedCommunityId || communityId,
      });
    },
    profileLanguage(): string {
      const profileLang = this.community?.typedExpressionLanguages.find(
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
      this.activeProfile = this.community.members.find(
        (m) => m.author.did === did
      );
    },
    handleMentionClick(dataset: { label: string; id: string }) {
      const { label, id } = dataset;
      if (label?.startsWith("#")) {
        this.$router.push({
          name: "channel",
          params: {
            channelId: id,
            communityId: this.community.perspective.uuid,
          },
        });
      }
      if (label?.startsWith("@")) {
        this.showProfile = true;
        this.activeProfile = this.community.members.find(
          (m) => m.author.did === `did:key:${id}`
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
      this.$store.commit("setHasNewMessages", {
        channelId: this.channel.perspective,
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
      this.$store.dispatch("loadExpressions", {
        from,
        to,
        communityId: this.community.perspective,
        channelId: this.channel.perspective,
      });
    },
    async createDirectMessage(message: string) {
      const escapedMessage = message.replace(/( |<([^>]+)>)/gi, "");

      this.currentExpressionPost = "";

      if (escapedMessage) {
        this.$store.dispatch("createExpression", {
          languageAddress: this.community.expressionLanguages[0]!,
          content: { body: message, background: [""] },
          perspective: this.channel.perspective.toString(),
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
  height: 74px;
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
  padding: var(--j-space-400);
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
