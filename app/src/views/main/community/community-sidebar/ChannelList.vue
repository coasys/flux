<template>
  <j-box pt="500" pb="800" px="500">
    <j-flex direction="column" gap="300">
      <div class="header">
        <j-icon name="diagram-3" size="sm" color="ui-400" />
        <j-text color="ui-400" uppercase nomargin>Channels</j-text>
        <j-box ml="200" mt="100" v-if="channelsLoading">
          <j-spinner size="xxs" />
        </j-box>
      </div>

      <j-flex direction="column">
        <ChannelListItem v-for="channel in nestedChannels" :channel="channel" />
      </j-flex>

      <j-flex
        a="center"
        gap="200"
        style="cursor: pointer; margin-left: -2px"
        @click="() => (modalStore.showCreateChannel = true)"
      >
        <j-icon size="sm" square name="plus" color="ui-400" />
        <j-text nomargin color="ui-400">Add channel</j-text>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { useModalStore } from "@/stores";
import ChannelListItem from "@/views/main/community/community-sidebar/ChannelListItem.vue";
import { defineOptions } from "vue";

defineOptions({ name: "ChannelList" });

const modalStore = useModalStore();
const { nestedChannels, channelsLoading } = useCommunityService();
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  height: 25px;
}
</style>
