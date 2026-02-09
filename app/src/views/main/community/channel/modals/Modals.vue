<template>
  <ManageChannelPluginsModal />
  <EditChannelNameModal />
  <!-- TODO: Hook these up, previously weren't showing -->
  <ChangeChannelModal />
  <JoiningCommunityModal />
  <ProfileModal />
</template>

<script setup lang="ts">
import ManageChannelPluginsModal from './ManageChannelPluginsModal.vue';
import EditChannelNameModal from './EditChannelNameModal.vue';
import ChangeChannelModal from './ChangeChannelModal.vue';
import JoiningCommunityModal from './JoiningCommunityModal.vue';
import ProfileModal from './ProfileModal.vue';
</script>
