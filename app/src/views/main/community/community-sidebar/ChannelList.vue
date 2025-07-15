<template>
  <j-box pt="500" pb="800" px="500">
    <j-flex direction="column" gap="400">
      <j-flex a="center" gap="300">
        <j-icon name="diagram-3" size="sm" color="ui-400" />
        <j-text color="ui-400" uppercase nomargin>Channels</j-text>
      </j-flex>

      <j-button @click.prevent="() => (modalStore.showCreateChannel = true)" size="sm" slot="end" variant="ghost">
        <j-icon size="sm" square name="plus" />
      </j-button>

      <j-box mt="400" ml="600" v-if="channelsLoading">
        <j-spinner size="sm" />
      </j-box>

      <j-popover
        event="contextmenu"
        placement="bottom-start"
        v-for="channel in nestedChannels"
        :key="channel.baseExpression"
      >
        <ChannelListItem v-for="channel in nestedChannels" :channel="channel" />
      </j-popover>

      <j-menu-item @click="() => (modalStore.showCreateChannel = true)" v-if="!channelsLoading">
        <j-icon size="xs" slot="start" name="plus" />
        Add channel
      </j-menu-item>
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

<style lang="scss" scoped></style>
