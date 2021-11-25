<template>
  <div class="channel-view" ref="scrollContainer">
    <channel-header :community="community" :channel="channel" />
    {{activeProfile}}
    <channel-messages
      :profileLanguage="profileLanguage"
      :community="community"
      :channel="channel"
      :messages="messages"
      :isAlreadyFetching="isAlreadyFetching"
      @profileClick="handleProfileClick"
      @mentionClick="handleMentionClick"
      @loadMore="loadMoreMessages"
      @updateLinkWorker="(e) => (linksWorker = e)"
      @updateExpressionWorker="(e) => (expressionWorker = e)"
    />
    <channel-footer :community="community" :channel="channel" />
    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e) => toggleProfile(e)"
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
  ExpressionAndRef,
} from "@/store/types";
import { Editor } from "@tiptap/vue-3";
import ChannelFooter from "./ChannelFooter.vue";
import ChannelMessages from "./ChannelMessages.vue";
import ChannelHeader from "./ChannelHeader.vue";
import Profile from "@/containers/Profile.vue";
import { useDataStore } from "@/store/data";
import { sortExpressionsByTimestamp } from "@/utils/expressionHelpers";
import { ad4mClient } from "@/app";

interface UserMap {
  [key: string]: ProfileExpression;
}

interface ExpressionAndRefWithId extends ExpressionAndRef {
  id: string;
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
    };
  },
  async mounted() {
    this.linksWorker?.terminate();
    this.fwdLinkWorker?.terminate();
    this.expressionWorker?.terminate();

    const { channelId, communityId } = this.$route.params;

    const { linksWorker, fwdLinkWorker, expressionWorker } =
      await this.dataStore.loadExpressions({
        channelId: channelId as string,
        expressionWorker: new Worker("pollingWorker.js"),
      });

    this.linksWorker = linksWorker;
    this.fwdLinkWorker = fwdLinkWorker;
    this.expressionWorker = expressionWorker;

    this.dataStore.setCurrentChannelId({
      communityId: communityId as string,
      channelId: channelId as string,
    });
  },
  beforeRouteUpdate(to, from, next) {
    this.linksWorker?.terminate();
    this.expressionWorker?.terminate();
    const editor = document.getElementsByTagName("j-editor")[0];
    (editor.shadowRoot?.querySelector("emoji-picker") as any)?.database.close();
    next();
  },
  beforeRouteLeave(to, from, next) {
    this.linksWorker?.terminate();
    this.expressionWorker?.terminate();
    const editor = document.getElementsByTagName("j-editor")[0];
    (editor.shadowRoot?.querySelector("emoji-picker") as any)?.database.close();
    next();
  },
  data() {
    return {
      noDelayRef: 0,
      currentExpressionPost: "",
      users: {} as UserMap,
      linksWorker: null as null | Worker,
      fwdLinkWorker: null as null | Worker,
      expressionWorker: null as null | Worker,
      editor: null as Editor | null,
      showList: false,
      showProfile: false,
      activeProfile: {} as any,
      previousFetchedTimestamp: null as string | undefined | null,
    };
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
    toggleProfile(e: any): void {
      if (!e.target.open) {
        this.activeProfile = undefined;
      }
      this.showProfile = e.target.open;
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
      this.linksWorker?.terminate();
      this.fwdLinkWorker?.terminate();
      this.expressionWorker?.terminate();

      const { linksWorker, fwdLinkWorker, expressionWorker } =
        await this.dataStore.loadExpressions({
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          channelId: this.channel.neighbourhood.perspective.uuid,
          expressionWorker: new Worker("pollingWorker.js"),
        });

      this.$emit("updateLinkWorker", linksWorker);
      this.$emit("updateFwdLinkWorker", fwdLinkWorker);
      this.$emit("updateExpressionWorker", expressionWorker);

      this.previousFetchedTimestamp = from;
    },
    async handleProfileClick(did: string) {
      this.activeProfile = did;

      const me = await ad4mClient.agent.me();

      if (did === me.did) {
        this.$router.push({ name: "my-profile", params: { did } });
      } else {
        this.$router.push({ name: "profile", params: { did } });
      }

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
  },
});
</script>

<style scoped>
.channel-view {
  height: 100vh;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}
</style>
