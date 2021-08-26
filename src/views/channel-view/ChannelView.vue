<template>
  <div class="channel-view" ref="scrollContainer">
    <channel-header :community="community" :channel="channel" />
    <channel-messages
      :profileLanguage="profileLanguage"
      :community="community"
      :channel="channel"
      :linksWorker="linksWorker"
      :expressionWorker="expressionWorker"
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
  data() {
    return {
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
  beforeRouteUpdate(to, from, next) {
    this.linksWorker?.terminate();
    const editor = document.getElementsByTagName('j-editor')[0];
    (editor.shadowRoot?.querySelector('emoji-picker') as any)?.database.close()
    next();
  },
  async mounted() {
    this.linksWorker?.terminate();
    this.expressionWorker?.terminate();

    const { channelId, communityId } = this.$route.params;

    this.expressionWorker = new Worker("pollingWorker.js");
    const { linksWorker, expressionWorker } =
      await store.dispatch.loadExpressions({
        channelId: channelId as string,
        expressionWorker: this.expressionWorker,
      });

    this.linksWorker = linksWorker;
    this.expressionWorker = expressionWorker;

    store.commit.setCurrentChannelId({
      communityId: communityId as string,
      channelId: channelId as string,
    });
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
