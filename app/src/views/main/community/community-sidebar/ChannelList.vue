<template>
  <j-box pt="500" pb="800">
    <j-menu-group open title="Channels">
      <j-button @click.prevent="() => (modalStore.showCreateChannel = true)" size="sm" slot="end" variant="ghost">
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>

      <j-box mt="400" ml="600" v-if="channelsLoading">
        <j-spinner size="sm" />
      </j-box>

      <j-popover event="contextmenu" placement="bottom-start" v-for="channel in channels" :key="channel.baseExpression">
        <ChannelListItem :channel="channel" />
      </j-popover>
    </j-menu-group>

    <j-menu-item @click="() => (modalStore.showCreateChannel = true)" v-if="!channelsLoading">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { useModalStore } from "@/stores";
import ChannelListItem from "@/views/main/community/community-sidebar/ChannelListItem.vue";
import { defineOptions } from "vue";

defineOptions({ name: "ChannelList" });

const modalStore = useModalStore();
const { channels, channelsLoading } = useCommunityService();
</script>

<style lang="scss" scoped></style>
