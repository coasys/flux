<template>
  <j-modal
    :open="modalStore.showEditChannelNameModal"
    @toggle="(e: any) => (modalStore.showEditChannelNameModal = e.target.open)"
  >
    <j-box p="800">
      <j-flex direction="column" gap="500">
        <j-text size="700" weight="600" color="primary-700" nomargin>
          Edit {{ isConversation ? 'Conversation' : 'Channel' }} Name
        </j-text>

        <j-input
          size="lg"
          label="Name"
          :value="name"
          @keydown.enter="name.length && !isSaving && updateChannel()"
          @input="(e: any) => (name = e.target.value)"
        />

        <j-box mt="500">
          <j-flex direction="row" j="end" gap="300">
            <j-button size="lg" variant="link" @click="modalStore.showEditChannelNameModal = false"> Cancel </j-button>
            <j-button
              :loading="isSaving"
              :disabled="!name.length || isSaving"
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
  </j-modal>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useModalStore } from '@/stores';
import { useModel } from '@coasys/ad4m-vue-hooks';
import { Channel, Conversation } from '@coasys/flux-api';
import { computed, ref, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const modalStore = useModalStore();

const {
  perspective,
  recentConversations,
  getPinnedConversations,
  getRecentConversations,
  getChannelsWithConversations,
} = useCommunityService();

const name = ref('');
const isSaving = ref(false);

const channelId = computed(() => route.params.channelId as string);
const channel = computed(() => channels.value?.[0] || null);
const isConversation = computed(() => channel.value?.isConversation);

const { entries: channels } = useModel({ perspective, model: Channel, query: { where: { base: channelId.value } } });

async function updateChannel() {
  isSaving.value = true;

  try {
    if (isConversation.value) {
      // Update the associated conversation name
      const conversationData = recentConversations.value.find(
        (c) => c.channel.baseExpression === channel.value.baseExpression,
      );
      const conversationId = toRaw(conversationData?.conversation)?.baseExpression;
      if (!conversationId) return;
      const conversationModel = new Conversation(perspective, conversationId);
      conversationModel.conversationName = name.value;
      await conversationModel.update();
      // Refresh sidebar channels
      getPinnedConversations();
      getRecentConversations();
      getChannelsWithConversations();
    } else {
      // Update the channel name directly
      const channelModel = new Channel(perspective, channelId.value);
      await channelModel.get(); // Must await the get() here otherwise channel views get lost in the update (not sure why)
      channelModel.name = name.value;
      await channelModel.update();
    }
  } finally {
    isSaving.value = false;
    modalStore.showEditChannelNameModal = false;
  }
}

watch(
  channel,
  (newChannel) => {
    if (newChannel) {
      if (newChannel.isConversation) {
        // Get the conversation name for the channel
        const conversationData = recentConversations.value.find(
          (c) => c.channel.baseExpression === newChannel.baseExpression,
        );
        name.value = conversationData?.conversation?.conversationName || '';
      } else {
        // Otherwise just use the channel name
        name.value = newChannel.name;
      }
    }
  },
  { deep: true },
);
</script>

<style scoped></style>
