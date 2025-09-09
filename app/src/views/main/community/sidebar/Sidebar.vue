<template>
  <SidebarHeader />

  <SidebarMembers />

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
    :limitTo="5"
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
import SidebarList from "@/views/main/community/sidebar/SidebarList.vue";
import SidebarMembers from "@/views/main/community/sidebar/SidebarMembers.vue";
import SidebarHeader from "./SidebarHeader.vue";

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
