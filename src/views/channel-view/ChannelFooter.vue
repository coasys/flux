<template>
  <footer class="channel-view__footer">
    <j-box pb="300" pt="300">
      <j-tabs
        size="sm"
        :value="expressionType"
        @change="(e) => (expressionType = e.target.value)"
      >
        <j-tab-item value="shortform">Text</j-tab-item>
        <j-tab-item value="junto-youtube"> Youtube </j-tab-item>
      </j-tabs>
    </j-box>
    <j-editor
      v-if="expressionType === 'shortform'"
      @keydown.enter="onEnter"
      autofocus
      :placeholder="`Write something in ${channel.name}`"
      :value="currentExpressionPost"
      @change="handleEditorChange"
      @onsuggestionlist="changeShowList"
      @editorinit="editorinit"
      :mentions="items"
    ></j-editor>
    <div
      v-if="expressionType !== 'shortform'"
      v-html="`<${expressionType}-create></${expressionType}-create`"
    />
  </footer>
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
import { v4 as uuidv4 } from "uuid";
import { getProfile } from "@/utils/profileHelpers";
import { DynamicScroller, DynamicScrollerItem } from "vue3-virtual-scroller";
import "vue3-virtual-scroller/dist/vue3-virtual-scroller.css";
import { differenceInMinutes, parseISO } from "date-fns";
import ExpressionView from "@/components/expression/Expression.vue";
import { Editor } from "@tiptap/vue-3";
import loadModule from "@/utils/loadModule";

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
  data() {
    return {
      expressionType: "shortform",
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
  watch: {
    expressionType: function (val) {
      this.$nextTick(() => {
        const element = document.querySelector(val + "-create") as any;
        if (element) {
          element.commitExpression = (content: any) => {
            this.createExpression(content);
          };
        }
      });
    },
    "channel.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        // If this channel is not in view, and only kept alive
        // show new messages button, so when you open the channel
        // again the button will be there
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
    memberMentions(): any[] {
      return this.community.members.map((m) => ({
        name: (m.data as any).profile["foaf:AccountName"],
        id: m.author.did,
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
            id: uuidv4(),
            did: item.expression.author.did,
            timestamp: item.expression.timestamp,
            //@ts-ignore
            data: item.expression.data,
            language: this.$store.getters.getLanguageUI(
              item.url.language.address
            ),
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
            communityId: this.community.perspective,
          },
        });
      }
      if (label?.startsWith("@")) {
        this.showProfile = true;
        this.activeProfile = this.community.members.find(
          (m) => m.author.did === id
        );
      }
    },
    onEnter(e: any) {
      if (!e.shiftKey && !this.showList) {
        console.log({ detail: e });
        this.currentExpressionPost = "";
        this.createExpression({ body: e.target.value, background: [""] });
        e.preventDefault();
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

    async createExpression(message: JuntoShortForm) {
      this.currentExpressionPost = "";
      const languages = Object.values(this.$store.state.expressionUI);
      const currentLang = languages.find((l) => l.name === this.expressionType);
      console.log(currentLang.languageAddress);

      this.$store.dispatch("createExpression", {
        languageAddress: currentLang.languageAddress,
        content: message,
        perspective: this.channel.perspective.toString(),
      });
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
  padding: var(--j-space-500);
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
  bottom: 0;
  padding-left: var(--j-space-500);
  padding-right: var(--j-space-500);
  padding-bottom: var(--j-space-300);
}

j-editor::part(base) {
  border: 0;
  padding: 0;
}

j-editor::part(editor) {
  padding-top: var(--j-space-500);
  padding-left: var(--j-space-300);
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
