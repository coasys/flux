<template>
  <div>
    <j-avatar size="xxs" :did="did" :src="profile?.profileThumbnailPicture" />
  </div>
</template>

<script setup lang="ts">
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";
import { defineOptions, defineProps, onMounted, ref } from "vue";

defineOptions({ name: "ActiveAgent" });
const props = defineProps({ did: { type: String, required: true } });
const profile = ref<null | Profile>(null);

onMounted(async () => (profile.value = await getCachedAgentProfile(props.did)));
</script>

<style lang="scss" scoped></style>
