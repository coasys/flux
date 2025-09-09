<template>
  <j-flex gap="300" a="center" :style="style">
    <div class="avatar-image">
      <j-avatar :size="size" :src="profile.profileThumbnailPicture || null" :hash="did" />
    </div>
    <j-text v-if="showName" nomargin>{{ profile.username || "Unknown User" }}</j-text>
  </j-flex>
</template>

<script setup lang="ts">
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { ref, watch } from "vue";

interface Props {
  did: string;
  size?: "sm" | "xs" | "lg" | "xl" | "xxs" | "xxl";
  showName?: boolean;
  style?: any;
}

const props = withDefaults(defineProps<Props>(), {
  size: "sm",
  showName: false,
});

const profile = ref<Partial<Profile>>({});

async function fetchProfile(did: string) {
  try {
    const result = await getCachedAgentProfile(did);
    profile.value = result || {};
  } catch (error) {
    console.error("Error loading profile:", error);
    profile.value = {};
  }
}

watch(
  () => props.did,
  (newDid) => fetchProfile(newDid),
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.avatar-image {
  background-color: var(--j-color-ui-100);
  box-shadow: 0 0 0 1px var(--j-color-ui-200);
  border-radius: 50%;
  width: var(--j-size-sm);
  height: var(--j-size-sm);
  z-index: 1;
}
</style>
