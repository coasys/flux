<template>
  <header class="channel-header">
    <j-flex a="center" gap="200">
      <j-icon color="ui-500" name="hash" />
      <j-text nomargin weight="500" size="500"> {{ this.channelName }}</j-text>
    </j-flex>
    <j-flex a="center" gap="300">
      <j-button
        variant="ghost"
        @click="
          setChannelNotificationState({
            channelId: channel.neighbourhood.perspective.uuid,
          })
        "
      >
        <j-icon
          slot="start"
          :name="channel?.state.notifications?.mute ? 'bell-slash' : 'bell'"
        />
      </j-button>
    </j-flex>
  </header>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapActions } from "pinia";
import { useDataStore } from "@/store/data";

export default defineComponent({
  props: ["channel", "community"],

  methods: {
    ...mapActions(useDataStore, ["setChannelNotificationState"]),
  },
  computed: {
    channelName() {
      if (
        this.community.neighbourhood.neighbourhoodUrl ==
        this.channel.neighbourhood.neighbourhoodUrl
      ) {
        return "Home";
      } else {
        return this.channel.neighbourhood.name;
      }
    },
  },
});
</script>

<style scoped>
.channel-header {
  min-height: 74px;
  height: 74px;
  max-height: 74px;
  padding: var(--j-space-400) var(--j-space-500);
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--app-channel-border-color);
  background: var(--app-channel-header-bg-color);
  z-index: 1;
}
</style>
