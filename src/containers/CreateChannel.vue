<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <div>
        <j-text variant="heading">Create Channel</j-text>
        <j-text variant="body">
          Channels are ways to organize your conversations by topics.
        </j-text>
      </div>
      <j-flex direction="column" gap="400">
        <j-input
          size="lg"
          label="Name"
          :minlength="10"
          :maxlength="30"
          autovalidate
          required
          type="text"
          :value="channelName"
          @keydown.enter="createChannel"
          @input="(e) => (channelName = e.target.value)"
        ></j-input>
        <div>
          <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
          <j-button
            size="lg"
            :loading="isCreatingChannel"
            :disabled="isCreatingChannel || !canSubmit"
            @click="createChannel"
            variant="primary"
          >
            Create Channel
          </j-button>
        </div>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { isValid } from "@/utils/validation";
import { defineComponent } from "vue";
import store from "@/store";

export default defineComponent({
  emits: ["cancel", "submit"],
  data() {
    return {
      channelName: "",
      isCreatingChannel: false,
    };
  },
  computed: {
    canSubmit(): boolean {
      return isValid(
        [
          {
            check: (val: string) => (val ? false : true),
            message: "This field is required",
          },
        ],
        this.channelName
      );
    },
  },
  methods: {
    async createChannel() {
      const communityId = this.$route.params.communityId.toString();
      const name = this.channelName;
      this.isCreatingChannel = true;
      store.dispatch
        .createChannel({
          communityId,
          name,
        })
        .then((channel) => {
          this.$emit("submit");
          this.channelName = "";
          this.$router.push({
            name: "channel",
            params: {
              communityId: communityId,
              channelId: channel.neighbourhood.perspective.uuid,
            },
          });
        })
        .finally(() => {
          this.isCreatingChannel = false;
        });
    },
  },
});
</script>
