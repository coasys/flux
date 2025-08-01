<template>
  <j-box p="800" :style="{ display: hideContainer ? 'none' : 'block' }">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
      <ImgUpload
        :value="profileBackground"
        @change="(url: string | null) => (profileBackground = url || '')"
        @hide="(val: boolean) => (hideContainer = val)"
      />
      <AvatarUpload
        :hash="me?.did"
        :value="profilePicture"
        @change="(url: string | null) => (profilePicture = url || '')"
      />
      <j-input
        size="lg"
        label="Username"
        @keydown.enter="saveProfile"
        :value="username"
        @input="(e: Event) => (username = (e.target as HTMLInputElement).value)"
      />
      <j-input
        size="lg"
        label="Bio"
        @keydown.enter="saveProfile"
        :value="bio"
        @input="(e: Event) => (bio = (e.target as HTMLInputElement).value)"
      />
      <j-flex gap="300">
        <j-button size="lg" @click="emit('cancel')"> Cancel </j-button>
        <j-button :disabled="saving" size="lg" :loading="saving" variant="primary" @click="saveProfile">
          Save
        </j-button>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import ImgUpload from "@/components/img-upload/ImgUpload.vue";
import { useAppStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { updateProfile } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";

const emit = defineEmits<{ cancel: []; submit: [] }>();

const appStore = useAppStore();
const { me } = storeToRefs(appStore);

const username = ref("");
const bio = ref("");
const profileBackground = ref("");
const profilePicture = ref("");

const hideContainer = ref(false);
const saving = ref(false);

async function saveProfile() {
  saving.value = true;

  try {
    await updateProfile({
      username: username.value,
      bio: bio.value,
      profilePicture: profilePicture.value,
      profileBackground: profileBackground.value,
    });

    emit("submit");

    appStore.refreshMyProfile();
  } catch (e) {
    console.error("Error updating profile:", e);
  } finally {
    saving.value = false;
  }
}

async function loadProfileData() {
  const profile = await getCachedAgentProfile(me.value.did);

  profileBackground.value = profile.profileBackground;
  profilePicture.value = profile.profilePicture;
  username.value = profile.username;
  bio.value = profile.bio;
}

onMounted(loadProfileData);
</script>

<style scoped>
.profile_bg {
  width: 100%;
  height: 100px;
}
</style>
