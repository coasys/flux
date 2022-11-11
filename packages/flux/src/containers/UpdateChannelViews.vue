<template>
  <j-box p="800">
    <j-flex direction="column" gap="500">
      <j-text variant="heading-sm">Update views</j-text>

      <ChannnelViewOptions
        :views="selectedViews"
        @change="(views: ChannelView[]) => (selectedViews = views)"
        :channelId="channelId"
      ></ChannnelViewOptions>

      <j-box mt="500">
        <j-flex direction="row" j="end" gap="300">
          <j-button size="lg" variant="link" @click="() => $emit('cancel')">
            Cancel
          </j-button>
          <j-button
            :disabled="!canSave"
            @click="updateChannelViews"
            size="lg"
            variant="primary"
          >
            Save
          </j-button>
        </j-flex>
      </j-box>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { ChannelView } from "utils/types";
import ChannnelViewOptions from "@/components/channel-view-options/ChannelViewOptions.vue";
import viewOptions from "utils/constants/viewOptions";

export default defineComponent({
  props: ["communityId", "channelId"],
  emits: ["cancel", "submit"],
  components: { ChannnelViewOptions },
  setup() {
    return {
      selectedViews: ref<ChannelView[]>([]),
      appStore: useAppStore(),
      dataStore: useDataStore(),
    };
  },
  created() {
    this.selectedViews = this.channel?.views || [];
  },
  computed: {
    canSave() {
      return this.selectedViews.length >= 1;
    },
    channel() {
      return this.dataStore.channels[this.channelId];
    },
    viewOptions() {
      return viewOptions;
    },
  },
  methods: {
    updateChannelViews() {
      this.dataStore
        .updateChannelViews({
          perspectiveUuid: this.communityId,
          channelId: this.channelId,
          views: this.selectedViews,
        })
        .then(() => {
          this.$emit("submit", true);
        });
    },
  },
});
</script>
