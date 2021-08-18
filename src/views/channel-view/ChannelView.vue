<template>
  <div class="channel-view" @scroll="handleScroll" ref="scrollContainer">
    <channel-header :community="community" :channel="channel" />
    <channel-messages
      :scrolledToBottom="scrolledToBottom"
      :scrolledToTop="scrolledToTop"
      :profileLanguage="profileLanguage"
      @scrollToBottom="scrollToBottom"
      :showNewMessagesButton="showNewMessagesButton"
      :community="community"
      :channel="channel"
      :linksWorker="linksWorker"
      @profileClick="handleProfileClick"
      @mentionClick="handleMentionClick"
      @updateLinkWorker="(e) => (linksWorker = e)"
      @updateExpressionWorker="(e) => (expressionWorker = e)"
    />
    <channel-footer :community="community" :channel="channel" />
    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e) => (showProfile = e.target.open)"
    >
      <Profile :did="activeProfile" :langAddress="profileLanguage" />
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import store from "@/store";
import {
  ChannelState,
  CommunityState,
  ExpressionTypes,
  ProfileExpression,
} from "@/store/types";
import { Editor } from "@tiptap/vue-3";
import ChannelFooter from "./ChannelFooter.vue";
import ChannelMessages from "./ChannelMessages.vue";
import ChannelHeader from "./ChannelHeader.vue";
import Profile from "@/containers/Profile.vue";
import { isAtBottom } from "@/utils/scroll";

interface UserMap {
  [key: string]: ProfileExpression;
}

export default defineComponent({
  name: "ChannelView",
  components: {
    ChannelHeader,
    ChannelMessages,
    ChannelFooter,
    Profile,
  },
  beforeUnmount() {
    if (this.channel.neighbourhood) {
      this.saveScrollPos(this.channel.neighbourhood.perspective.uuid);
    }
    this.linksWorker?.terminate();
  },
  data() {
    return {
      scrolledToTop: false,
      scrolledToBottom: false,
      showNewMessagesButton: false,
      noDelayRef: 0,
      currentExpressionPost: "",
      users: {} as UserMap,
      linksWorker: null as null | Worker,
      expressionWorker: null as null | Worker,
      editor: null as Editor | null,
      showList: false,
      showProfile: false,
      activeProfile: {} as any,
    };
  },
  async mounted() {
    this.linksWorker?.terminate();
    this.expressionWorker?.terminate();

    const { channelId, communityId } = this.$route.params;

    const { linksWorker, expressionWorker } =
      await store.dispatch.loadExpressions({
        channelId: channelId as string,
      });

    this.linksWorker = linksWorker;
    this.expressionWorker = expressionWorker;

    store.commit.setCurrentChannelId({
      communityId: communityId as string,
      channelId: channelId as string,
    });

    // TODO: On first mount view takes too long to render
    // So we don't have the full height to scroll to the right place
    setTimeout(() => {
      this.scrollToLatestPos();
    }, 0);
  },
  watch: {
    scrolledToBottom: function (atBottom) {
      if (atBottom) {
        this.markAsRead();
      }
    },
    "channel.state.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        const container = this.$refs.scrollContainer as HTMLDivElement;
        if (container) {
          const atBottom = isAtBottom(container);
          if (atBottom) {
            this.scrollToBottom("smooth");
          } else {
            this.showNewMessagesButton = true;
          }
        }
      }
    },
  },
  computed: {
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
    saveScrollPos(channelId: string) {
      const scrollContainer = this.$refs.scrollContainer as HTMLDivElement;
      store.commit.setChannelScrollTop({
        channelId: channelId as string,
        value: scrollContainer ? scrollContainer.scrollTop : 0,
      });
    },
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

        this.scrolledToBottom = isAtBottom(scrollContainer);

        if (this.scrolledToBottom && this.channel.state.hasNewMessages) {
          this.markAsRead();
        }
        if (!this.scrolledToBottom && this.channel.state.hasNewMessages) {
          this.showNewMessagesButton = true;
        }
      });
    },
    handleProfileClick(did: string) {
      this.showProfile = true;
      this.activeProfile = did;
    },
    handleMentionClick(dataset: { label: string; id: string }) {
      const { label, id } = dataset;
      if (label?.startsWith("#")) {
        let channelId =
          store.getters.getChannelByNeighbourhoodUrl(id)?.neighbourhood
            .perspective.uuid;
        if (channelId) {
          this.$router.push({
            name: "channel",
            params: {
              channelId: channelId,
              communityId: this.community.neighbourhood.perspective.uuid,
            },
          });
        }
      }
      if (label?.startsWith("@")) {
        this.showProfile = true;
        this.activeProfile = id;
      }
    },
    markAsRead() {
      store.commit.setHasNewMessages({
        channelId: this.channel.neighbourhood.perspective.uuid,
        value: false,
      });
      this.showNewMessagesButton = false;
    },
    handleScroll(e: any) {
      this.scrolledToTop = e.target.scrollTop <= 20;
      this.scrolledToBottom = isAtBottom(e.target);
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
.channel-view {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>
