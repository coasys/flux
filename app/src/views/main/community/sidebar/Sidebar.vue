<template>
  <SidebarHeader />

  <SidebarMembers />

  <j-box mt="800" mb="500" pl="500">
    <j-flex gap="300">
      <j-button variant="primary" @click="() => startNewConversation()" :loading="newConversationLoading">
        <j-icon name="door-open" />
        Start conversation
      </j-button>
      <j-button
        v-if="hasMemoryEntries"
        variant="subtle"
        @click="navigateToMemory"
        :class="{ active: isMemoryRoute }"
        title="Agent Memory"
      >
        <j-icon name="brain" />
      </j-button>
    </j-flex>
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
import { useCommunityService } from '@/composables/useCommunityService';
import { MemoryEntry } from '@coasys/flux-api';
import SidebarList from '@/views/main/community/sidebar/SidebarList.vue';
import SidebarMembers from '@/views/main/community/sidebar/SidebarMembers.vue';
import SidebarHeader from './SidebarHeader.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const {
  perspective,
  pinnedConversationsWithAgents,
  pinnedConversationsLoading,
  recentConversationsWithAgents,
  recentConversationsLoading,
  channelsWithConversationsAndAgents,
  channelsWithConversationsLoading,
  newConversationLoading,
  startNewConversation,
} = useCommunityService();

// Check if this neighbourhood has MemoryEntry instances
const hasMemoryEntries = ref(false);
onMounted(async () => {
  try {
    console.log('[MemoryView] Checking for MemoryEntry instances...');
    console.log('[MemoryView] perspective:', perspective?.uuid);
    const entries = await MemoryEntry.findAll(perspective);
    console.log('[MemoryView] Found entries:', entries.length);
    hasMemoryEntries.value = entries.length > 0;
  } catch (e) {
    console.error('[MemoryView] Error checking MemoryEntry:', e);
    hasMemoryEntries.value = false;
  }
});

const isMemoryRoute = computed(() => route.name === 'memory');

function navigateToMemory() {
  router.push({ name: 'memory', params: { communityId: route.params.communityId } });
}
</script>
