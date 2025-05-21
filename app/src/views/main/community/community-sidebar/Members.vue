<template>
  <j-box pt="500">
    <j-menu-group open :title="`Members ${loading ? '' : `(${members.length})`}`">
      <j-button @click.prevent="() => modals.setShowInviteCode(true)" size="sm" slot="end" variant="ghost">
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <j-box px="500">
        <AvatarGroup
          @click="() => modals.setShowCommunityMembers(true)"
          :loading="loading"
          :users="members"
          tooltip-title="See all members"
        />
      </j-box>
    </j-menu-group>
  </j-box>
</template>

<script setup lang="ts">
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { useModalStore } from "@/store";
import { computed } from "vue";

defineOptions({ name: "Members" });

const modals = useModalStore();
const { membersLoading, members } = useCommunityService();

const loading = computed(() => {
  // Only show loading if there are no members currently displayed and the loading state is true
  return !members.value.length && membersLoading.value;
});
</script>
