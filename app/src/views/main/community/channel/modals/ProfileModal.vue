<template>
  <j-modal size="xs" :open="showProfile" @toggle="(e: any) => toggleProfile(e.target.open, activeProfile)">
    <j-box class="profile" v-if="profile" p="800">
      <j-box pb="500">
        <j-avatar size="xxl" :hash="activeProfile" :src="profile.profileThumbnailPicture" />
      </j-box>

      <j-text v-if="profile.familyName || profile.givenName" size="600" color="black" weight="800" nomargin>
        {{ `${profile.givenName} ${profile.familyName}` }}
      </j-text>
      <j-text color="ui-500"> @{{ profile.username }}</j-text>
      <j-text v-if="profile.bio" size="400"> {{ profile.bio }}</j-text>
      <j-button variant="link" @click="handleProfileClick(activeProfile)"> View full profile </j-button>
    </j-box>
    <j-box p="800" v-else>
      <j-flex a="center" direction="column" gap="500">
        <j-skeleton variant="circle" width="xxl" height="xxl" />
        <j-skeleton width="xxl" height="text" />
        <j-skeleton width="xxl" height="text" />
        <j-button disabled variant="link"> View full profile </j-button>
      </j-flex>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// TODO: need to hook this up

const router = useRouter();
const route = useRoute();

const appStore = useAppStore();

const { me } = storeToRefs(appStore);

const activeProfile = ref<string>("");
const showProfile = ref(false);
const profile = ref<Profile>();

// Watch for DID changes and load profile
watch(
  () => activeProfile.value,
  async (newDid, oldDid) => {
    if (newDid !== oldDid && newDid) {
      profile.value = await getCachedAgentProfile(newDid);
    }
  },
  { immediate: true }
);

function toggleProfile(open: boolean, did?: any): void {
  if (!open) {
    activeProfile.value = "";
    profile.value = undefined;
  } else {
    activeProfile.value = did;
  }
  showProfile.value = open;
}

async function handleProfileClick(did: string) {
  activeProfile.value = did;
  if (did === me.value.did) router.push({ name: "home", params: { did } });
  else router.push({ name: "profile", params: { did, communityId: route.params.communityId } });
}
</script>

<style scoped>
.profile {
  text-align: center;
}
</style>
