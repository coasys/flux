<template>
  <chat-view
    @seen-all-expressions="handleMarkAsRead"
    @agent-click="handleProfileClick"
    :perspective-uuid="$route.params.channelId"
  ></chat-view>
  <j-modal
    size="xs"
    v-if="currentProfile"
    :open="showProfile"
    @toggle="(e) => (showProfile = e.target.open)"
  >
    <Profile :did="currentProfile" :langAddress="profileLanguage" />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Profile from "@/containers/Profile.vue";
import ChatView from "junto-plugin-chat-view";
import { useDataStore } from "@/store/data";
import { CommunityState, ExpressionTypes } from "@/store/types";

customElements.define("chat-view", ChatView);

export default defineComponent({
  name: "ChannelView",
  components: {
    Profile,
  },
  setup() {
    const dataStore = useDataStore();
    return {
      dataStore,
    };
  },
  data() {
    return {
      showProfile: false,
      currentProfile: "",
    };
  },
  methods: {
    handleProfileClick(event: any) {
      this.currentProfile = event.detail[0];
      this.showProfile = true;
    },
    handleMarkAsRead() {
      console.log("mark as read");
      const { channelId } = this.$route.params;
      this.dataStore.setHasNewMessages({
        channelId: channelId as string,
        value: false,
      });
    },
  },
  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;

      return this.dataStore.getCommunity(communityId as string);
    },
    profileLanguage(): string {
      const profileLang =
        this.community.neighbourhood.typedExpressionLanguages.find(
          (t) => t.expressionType === ExpressionTypes.ProfileExpression
        );
      return profileLang!.languageAddress;
    },
  },
});
</script>
