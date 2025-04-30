<template>
  <j-box pt="500">
    <j-menu-group open :title="`Members ${membersLoading ? '' : `(${members.length})`}`">
      <j-button @click.prevent="() => setShowInviteCode(true)" size="sm" slot="end" variant="ghost">
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <j-box px="500">
        <avatar-group @click="() => setShowCommunityMembers(true)" :loading="membersLoading" :users="members" />
      </j-box>
    </j-menu-group>
  </j-box>
</template>

<script setup lang="ts">
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { useAppStore } from "@/store/app";

const { setShowInviteCode, setShowCommunityMembers } = useAppStore();
const { membersLoading, members } = useCommunityService();
</script>
