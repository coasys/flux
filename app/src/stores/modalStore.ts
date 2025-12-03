import { Channel } from '@coasys/flux-api';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore(
  'modalStore',
  () => {
    const showDisclaimer = ref(true);
    const showCreateCommunity = ref(false);
    const showEditCommunity = ref(false);
    const showCommunityMembers = ref(false);
    const showCreateChannel = ref(false);
    const showEditChannel = ref(false);
    const showEditProfile = ref(false);
    const showSettings = ref(false);
    const showCommunitySettings = ref(false);
    const showInviteCode = ref(false);
    const showCommunityTweaks = ref(false);
    const showLeaveCommunity = ref(false);
    const showWebrtcSettings = ref(false);
    const showJoinCommunity = ref(false);
    const showAddWebLink = ref(false);

    // Used to track the parent channel when creating a subchannels in the CreateChannel modal
    const createChannelParent = ref<Channel | null>(null);

    function hideCreateChannelModal() {
      showCreateChannel.value = false;

      // Reset the parent channel when closing the modal
      createChannelParent.value = null;
    }

    function closeAllModals(): void {
      showDisclaimer.value = false;
      showCreateCommunity.value = false;
      showEditCommunity.value = false;
      showCommunityMembers.value = false;
      showCreateChannel.value = false;
      showEditChannel.value = false;
      showEditProfile.value = false;
      showSettings.value = false;
      showCommunitySettings.value = false;
      showInviteCode.value = false;
      showCommunityTweaks.value = false;
      showLeaveCommunity.value = false;
      showWebrtcSettings.value = false;
      showJoinCommunity.value = false;
      showAddWebLink.value = false;
    }

    return {
      showDisclaimer,
      showCreateCommunity,
      showEditCommunity,
      showCommunityMembers,
      showCreateChannel,
      showEditChannel,
      showEditProfile,
      showSettings,
      showCommunitySettings,
      showInviteCode,
      showCommunityTweaks,
      showLeaveCommunity,
      showWebrtcSettings,
      showJoinCommunity,
      showAddWebLink,
      createChannelParent,

      hideCreateChannelModal,
      closeAllModals,
    };
  },
  { persist: { omit: ['createChannelParent'] } },
);
