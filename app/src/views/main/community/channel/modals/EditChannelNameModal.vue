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

        <j-flex v-if="isConversation" a="center" gap="300">
          <j-checkbox :checked="lockName" @change="(e: any) => (lockName = e.target.checked)" />
          <j-text color="ui-600" nomargin> Lock name (prevent future AI updates) </j-text>
        </j-flex>

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
import { useAppStore, useModalStore } from '@/stores';
import { restoreChannelPrefix } from '@/utils/routeUtils';
import { Channel, Conversation } from '@coasys/flux-api';
import { computed, ref, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const modalStore = useModalStore();
const appStore = useAppStore();

const {
  perspective,
  recentConversations,
  getPinnedConversations,
  getRecentConversations,
  getChannelsWithConversations,
  allChannels,
} = useCommunityService();

const name = ref('');
const lockName = ref(false);
const isSaving = ref(false);

const channelId = computed(() => restoreChannelPrefix(route.params.channelId as string));
const channel = computed(() => allChannels.value.find((c) => c.id === channelId.value) || null);
const isConversation = computed(() => channel.value?.isConversation);

async function updateChannel() {
  isSaving.value = true;

  try {
    if (isConversation.value) {
      // Update the associated conversation name
      const conversationData = recentConversations.value.find((c) => c.channel.id === channel.value.id);
      const conversationId = toRaw(conversationData?.conversation)?.id;
      if (!conversationId) {
        isSaving.value = false;
        modalStore.showEditChannelNameModal = false;
        appStore.showDangerToast({
          message: 'Conversation not found. Unable to update name.',
        });
        return;
      }
      const conversationModel = new Conversation(perspective, conversationId);
      conversationModel.conversationName = name.value;
      conversationModel.nameFixed = lockName.value;
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

    // Close modal only on success
    modalStore.showEditChannelNameModal = false;
  } catch (error) {
    console.error('Failed to update channel name:', error);
    appStore.showDangerToast({
      message: `Failed to update ${isConversation.value ? 'conversation' : 'channel'} name. Please try again.`,
    });
  } finally {
    isSaving.value = false;
  }
}

// Update name only when modal opens, not continuously
watch(
  () => modalStore.showEditChannelNameModal,
  (isOpen) => {
    if (isOpen && channel.value) {
      if (channel.value.isConversation) {
        // Get the conversation name and lock state for the channel
        const conversationData = recentConversations.value.find((c) => c.channel.id === channel.value.id);
        if (conversationData?.conversation) {
          name.value = conversationData.conversation.conversationName!;
          lockName.value = conversationData.conversation.nameFixed!;
        }
      } else {
        // Otherwise just use the channel name
        name.value = channel.value.name;
      }
    }
  },
);
</script>

<style scoped></style>
