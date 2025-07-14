<template>
  <div class="wrapper">
    <j-text>Explore and manage sub channels here!</j-text>

    <j-box mt="500">
      <j-flex gap="500" wrap>
        <button class="item" v-for="channel in subChannels">
          <j-flex direction="column" a="center" gap="400">
            <j-flex a="center" gap="400">
              <j-icon :name="channel.isConversation ? 'flower2' : 'hash'" color="ui-700" />
              <j-text nomargin uppercase size="600" weight="600" color="ui-700">{{ channel.name }}</j-text>
            </j-flex>
            <j-text v-if="channel.description && !Array.isArray(channel.description)">{{ channel.description }}</j-text>
          </j-flex>
        </button>

        <button class="item" @click="openNewSubChannelModal">
          <j-icon name="plus" size="xl" />
          <j-text> Create a new sub channel </j-text>
        </button>
      </j-flex>
    </j-box>
  </div>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { useModalStore } from "@/stores";
import { useModel } from "@coasys/ad4m-vue-hooks";
import { Channel } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import { onMounted, watch } from "vue";

interface Props {
  parentChannel: Channel;
}

const props = defineProps<Props>();

const modalStore = useModalStore();

const { showCreateChannel, createChannelParent } = storeToRefs(modalStore);
const { perspective } = useCommunityService();

const { entries: subChannels } = useModel({
  perspective,
  model: Channel,
  query: { source: props.parentChannel.baseExpression },
});

function openNewSubChannelModal() {
  createChannelParent.value = props.parentChannel;
  showCreateChannel.value = true;
}

onMounted(() => {
  console.log("SubChannels component mounted", props.parentChannel);
});

watch(subChannels, (newSubChannels) => {
  console.log("newSubChannels:", newSubChannels);
});
</script>

<style lang="scss" scoped>
.wrapper {
  padding: var(--j-space-600);

  .item {
    all: unset;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--j-color-ui-100);
    border: 1px solid var(--j-color-ui-300);
    border-radius: var(--j-border-radius);
    width: 300px;
    height: 300px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--j-color-ui-200);
    }
  }
}
</style>
