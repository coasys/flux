<template>
  <Header />
  <Members />

  <j-box mt="800" mb="500" pl="500">
    <j-button variant="primary" @click="() => startNewConversation()" :loading="newConversationLoading">
      <j-icon name="door-open" />
      Start conversation
    </j-button>
  </j-box>

  <SidebarList
    v-if="pinnedConversationsWithAgents.length"
    title="Pinned Conversations"
    icon="pin"
    :loading="pinnedConversationsLoading"
    :items="pinnedConversationsWithAgents"
  />

  <SidebarList
    v-if="recentConversationsWithAgents.length"
    title="Recent Conversations"
    icon="clock"
    :loading="recentConversationsLoading"
    :items="recentConversationsWithAgents"
  />

  <SidebarList
    title="Channels"
    icon="diagram-3"
    :loading="channelsWithConversationsLoading"
    :items="channelsWithConversationsAndAgents"
  />
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import SidebarList from "@/views/main/community/community-sidebar/SidebarList.vue";
import Header from "./Header.vue";
import Members from "./Members.vue";

defineOptions({ name: "CommunitySidebar" });

const {
  pinnedConversationsWithAgents,
  pinnedConversationsLoading,
  recentConversationsWithAgents,
  recentConversationsLoading,
  channelsWithConversationsAndAgents,
  channelsWithConversationsLoading,
  newConversationLoading,
  startNewConversation,
} = useCommunityService();
</script>
