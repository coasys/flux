<template>
  <div class="channel-view" @scroll="handleScroll" ref="scrollContainer">
    <channel-header :community="community" :channel="channel" />
    <channel-messages
      :profileLanguage="profileLanguage"
      @scrollToBottom="scrollToBottom"
      :showNewMessagesButton="showNewMessagesButton"
      :community="community"
      :channel="channel"
      @profileClick="handleProfileClick"
      @mentionClick="handleMentionClick"
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
import { useDataStore } from "@/store/data";

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
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    }
  },
  async mounted() {
    this.linksWorker?.terminate();

    const { channelId, communityId } = this.$route.params;

    const { linksWorker } = await this.dataStore.loadExpressions({
      channelId: channelId as string,
    });

    this.linksWorker = linksWorker;

    this.dataStore.setCurrentChannelId({
      communityId: communityId as string,
      channelId: channelId as string,
    });

    // TODO: On first mount view takes too long to render
    // So we don't have the full height to scroll to the right place
    setTimeout(() => {
      this.scrollToLatestPos();
    }, 0);
  },
  beforeUnmount() {
    this.saveScrollPos(this.channel.neighbourhood.perspective.uuid);
    this.linksWorker?.terminate();
  },
  data() {
    return {
      showNewMessagesButton: false,
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
    "channel.state.hasNewMessages": function (hasMessages) {
      if (hasMessages) {
        const container = this.$refs.scrollContainer as HTMLDivElement;
        if (container) {
          const isAtBottom =
            container.scrollHeight - window.innerHeight === container.scrollTop;

          if (isAtBottom) {
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
      return this.dataStore.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const { channelId } = this.$route.params;
      return this.dataStore.getChannel(channelId as string);
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
      this.dataStore.setChannelScrollTop({
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
    handleProfileClick(did: string) {
      this.showProfile = true;
      this.activeProfile = did;
    },
    handleMentionClick(dataset: { label: string; id: string }) {
      const { label, id } = dataset;
      if (label?.startsWith("#")) {
        let channelId =
          this.dataStore.getChannelByNeighbourhoodUrl(id)?.neighbourhood
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
      this.dataStore.setHasNewMessages({
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
