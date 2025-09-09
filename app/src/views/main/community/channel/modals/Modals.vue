<template>
  <EditChannelModal />
  <!-- TODO: Hook these up, previously weren't showing -->
  <ChangeChannelModal />
  <JoiningCommunityModal />
  <ProfileModal />
</template>

<script setup lang="ts">
import ChangeChannelModal from "./ChangeChannelModal.vue";
import EditChannelModal from "./EditChannelModal.vue";
import JoiningCommunityModal from "./JoiningCommunityModal.vue";
import ProfileModal from "./ProfileModal.vue";
</script>
