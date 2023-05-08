<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <div>
        <j-text variant="heading-sm">Create Channel</j-text>
        <j-text variant="body">
          Channels are ways to organize your conversations by topics.
        </j-text>
      </div>
      <j-flex direction="column" gap="400">
        <j-input
          autofocus
          size="lg"
          label="Name"
          :minlength="10"
          :maxlength="30"
          autovalidate
          required
          type="text"
          :value="channelName"
          @keydown.enter="createChannel"
          @input="(e: any) => (channelName = e.target.value)"
        ></j-input>
        <j-box pb="500" pt="300">
          <j-box pb="300">
            <j-text variant="label">Select at least one view</j-text>
          </j-box>
          <ChannelViewOptions
            :views="selectedViews"
            @change="(views: ChannelView[]) => (selectedViews = views)"
          ></ChannelViewOptions>
        </j-box>

        <j-box mt="500">
          <j-flex direction="row" j="end" gap="300">
            <j-button size="lg" variant="link" @click="() => $emit('cancel')">
              Cancel
            </j-button>
            <j-button
              size="lg"
              :loading="isCreatingChannel"
              :disabled="isCreatingChannel || !canSubmit"
              @click="createChannel"
              variant="primary"
            >
              Create
            </j-button>
          </j-flex>
        </j-box>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { useDataStore } from "@/store/data";
import { useEntry, usePerspective } from "@fluxapp/vue";
import { isValid } from "@/utils/validation";
import { ChannelView } from "@fluxapp/types";
import { defineComponent } from "vue";
import ChannelViewOptions from "@/components/channel-view-options/ChannelViewOptions.vue";
import { useRoute } from "vue-router";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { Channel } from "@fluxapp/api";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { ChannelViewOptions },
  async setup() {
    const dataStore = useDataStore();

    const route = useRoute();

    const client = await getAd4mClient();

    const { data } = usePerspective(client, () => route.params.communityId);

    const { repo } = useEntry({
      perspective: () => data.value.perspective,
      model: Channel,
    });

    return {
      repo,
      dataStore,
    };
  },
  data() {
    return {
      selectedViews: [] as ChannelView[],
      channelView: "chat",
      channelName: "",
      isCreatingChannel: false,
    };
  },
  computed: {
    hasName(): boolean {
      return this.channelName?.length >= 3;
    },
    canSubmit(): boolean {
      return this.hasName && this.validSelectedViews;
    },
    validSelectedViews() {
      return this.selectedViews.length >= 1;
    },
  },
  methods: {
    async createChannel() {
      try {
        const communityId = this.$route.params.communityId as string;
        const name = this.channelName;
        this.isCreatingChannel = true;

        const channel = await this.repo?.create({
          name: name,
          views: [...this.selectedViews],
        });

        this.$emit("submit");
        this.channelName = "";
        this.$router.push({
          name: "channel",
          params: {
            communityId: communityId.toString(),
            channelId: channel.id,
          },
        });
      } catch (e) {
        console.log(e);
      } finally {
        this.isCreatingChannel = false;
      }
    },
  },
});
</script>
