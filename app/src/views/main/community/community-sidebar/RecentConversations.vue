<template>
  <j-box mt="800" mb="400" px="500">
    <j-flex direction="column" gap="400">
      <div class="header">
        <j-icon name="clock" size="sm" color="ui-400" />
        <j-text color="ui-400" uppercase nomargin>Recent Conversations</j-text>
        <j-box ml="200" mt="100" v-if="recentConversationsLoading">
          <j-spinner size="xxs" />
        </j-box>
      </div>

      <div
        v-for="conversation in recentConversations"
        @click="navigateToConversation(conversation.channelId)"
        style="cursor: pointer"
      >
        <j-flex a="center" gap="200">
          <j-text nomargin>{{ conversation.conversationName }}</j-text>
          <j-text nomargin size="300">•</j-text>
          <j-text nomargin size="300">
            <j-timestamp :value="conversation.lastActivity" relative class="timestamp" />
          </j-text>
        </j-flex>
      </div>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { defineOptions } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "RecentConversations" });

const route = useRoute();
const router = useRouter();
const { recentConversations, recentConversationsLoading } = useCommunityService();

function navigateToConversation(channelId: string) {
  router.push({
    name: "view",
    params: { communityId: route.params.communityId, channelId, viewId: "conversation" },
  });
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  height: 25px;
}
</style>
