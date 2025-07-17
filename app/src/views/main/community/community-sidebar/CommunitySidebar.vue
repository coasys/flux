<template>
  <Header />
  <Members />
  <j-box mt="800" mb="500" pl="500">
    <j-button @click="() => startNewConversation()" variant="primary" :loading="newConversationLoading">
      <j-icon name="door-open" />
      Start conversation
    </j-button>
  </j-box>
  <PinnedConversations v-if="pinnedConversations.length" />
  <RecentConversations v-if="recentConversations.length" />
  <ChannelList />
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import ChannelList from "./ChannelList.vue";
import Header from "./Header.vue";
import Members from "./Members.vue";
import PinnedConversations from "./PinnedConversations.vue";
import RecentConversations from "./RecentConversations.vue";

defineOptions({ name: "CommunitySidebar" });

const { pinnedConversations, recentConversations, newConversationLoading, startNewConversation } =
  useCommunityService();
</script>
