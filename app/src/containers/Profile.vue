<template>
  <j-box class="profile" v-if="profile" p="800">
    <j-box pb="500">
      <j-avatar size="xxl" :hash="did" :src="profile.profileThumbnailPicture" />
    </j-box>

    <j-text v-if="profile.familyName || profile.givenName" size="600" color="black" weight="800" nomargin>
      {{ `${profile.givenName} ${profile.familyName}` }}
    </j-text>
    <j-text color="ui-500"> @{{ profile.username }}</j-text>
    <j-text v-if="profile.bio" size="400"> {{ profile.bio }}</j-text>
    <j-button variant="link" @click="emit('openCompleteProfile')"> View full profile </j-button>
  </j-box>
  <j-box p="800" v-else>
    <j-flex a="center" direction="column" gap="500">
      <j-skeleton variant="circle" width="xxl" height="xxl" />
      <j-skeleton width="xxl" height="text" />
      <j-skeleton width="xxl" height="text" />
      <j-button disabled variant="link" @click="emit('openCompleteProfile')"> View full profile </j-button>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { ref, watch } from "vue";

interface Props {
  did: string;
  langAddress?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{ openCompleteProfile: [] }>();

const profile = ref<Profile>();

// Watch for DID changes and load profile
watch(
  () => props.did,
  async (newDid, oldDid) => {
    if (newDid !== oldDid) {
      profile.value = await getCachedAgentProfile(newDid);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.profile {
  text-align: center;
}
</style>
