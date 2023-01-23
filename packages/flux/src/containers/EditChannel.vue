<template>
  <j-box p="800">
    <j-flex direction="column" gap="500">
      <j-text variant="heading-sm">Edit Channel</j-text>

      <j-input
        size="lg"
        label="Name"
        :value="name"
        @keydown.enter="updateChannel"
        @input="(e) => (name = e.target.value)"
      ></j-input>

      <ChannnelViewOptions
        :views="views"
        @change="(v: ChannelView[]) => (views = v)"
        :channelId="channelId"
      ></ChannnelViewOptions>

      <j-box mt="500">
        <j-flex direction="row" j="end" gap="300">
          <j-button size="lg" variant="link" @click="() => $emit('cancel')">
            Cancel
          </j-button>
          <j-button
            :loading="isSaving"
            :disabled="!canSave || isSaving"
            @click="updateChannel"
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
import { viewOptions } from "utils/constants";

export default defineComponent({
  props: ["communityId", "channelId"],
  emits: ["cancel", "submit"],
  components: { ChannnelViewOptions },
  setup() {
    return {
      name: ref(""),
      description: ref(""),
      views: ref<ChannelView[]>([]),
      isSaving: ref(false),
      appStore: useAppStore(),
      dataStore: useDataStore(),
    };
  },
  computed: {
    canSave() {
      return this.views.length >= 1;
    },
    channel() {
      return this.dataStore.channels[this.channelId];
    },
    viewOptions() {
      return viewOptions;
    },
  },
  watch: {
    channel: {
      handler: async function ({ name, description, views }) {
        this.name = name;
        this.description = description;
        this.views = views;
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    async updateChannel() {
      this.isSaving = true;
      this.dataStore
        .updateChannel({
          perspectiveUuid: this.$route.params.communityId as string,
          channelId: this.$route.params.channelId as string,
          data: {
            name: this.name,
            views: this.views,
          },
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isSaving = false;
        });
    },
  },
});
</script>
