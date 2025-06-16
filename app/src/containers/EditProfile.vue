<template>
  <j-box p="800" :style="{ display: hideContainer ? 'none' : 'block' }">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
      <ImgUpload
        :value="profileBackground"
        @change="(url) => (profileBackground = url || '')"
        @hide="(val) => (hideContainer = val)"
      />
      <AvatarUpload :hash="me?.did" :value="profilePicture" @change="(url) => (profilePicture = url || '')" />
      <j-input
        size="lg"
        label="Username"
        @keydown.enter="updateProfileMethod"
        :value="username"
        @input="(e: Event) => (username = (e.target as HTMLInputElement).value)"
      />
      <j-input
        size="lg"
        label="Bio"
        @keydown.enter="updateProfileMethod"
        :value="bio"
        @input="(e: Event) => (bio = (e.target as HTMLInputElement).value)"
      />
      <j-flex gap="200">
        <j-button size="lg" @click="emit('cancel')"> Cancel </j-button>
        <j-button
          :disabled="isUpdatingProfile"
          size="lg"
          :loading="isUpdatingProfile"
          variant="primary"
          @click="updateProfileMethod"
        >
          Save
        </j-button>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import ImgUpload from "@/components/img-upload/ImgUpload.vue";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { useMe } from "@coasys/ad4m-vue-hooks";
import { getProfile, updateProfile } from "@coasys/flux-api";
import { profileFormatter } from "@coasys/flux-utils";
import { onMounted, ref, watch } from "vue";

const emit = defineEmits<{ cancel: []; submit: [] }>();

const isUpdatingProfile = ref(false);
const username = ref("");
const bio = ref("");
const profileBackground = ref("");
const profilePicture = ref("");
const hideContainer = ref(false);

// Setup AD4M client and profile
const client = await getAd4mClient();
const { profile, me } = useMe(client.agent, profileFormatter);

// Methods
async function updateProfileMethod() {
  isUpdatingProfile.value = true;

  try {
    await updateProfile({
      username: username.value,
      profilePicture: profilePicture.value,
      bio: bio.value,
      profileBackground: profileBackground.value,
    });

    emit("submit");
  } catch (e) {
    console.error("Error updating profile:", e);
  } finally {
    isUpdatingProfile.value = false;
  }
}

// Load profile data when component mounts and when profile/me changes
async function loadProfileData() {
  if (me.value?.did) {
    try {
      const profileData = await getProfile(me.value.did);
      profilePicture.value = profileData.profilePicture || "";
      profileBackground.value = profileData.profileBackground || "";
    } catch (error) {
      console.error("Error loading profile:", error);
    }

    username.value = profile.value?.username || "";
    bio.value = profile.value?.bio || "";
  }
}

// Watch for changes in profile and me data
watch([profile, me], loadProfileData, { immediate: true });

// Also load data on mount as fallback
onMounted(() => loadProfileData());
</script>

<style scoped>
.profile_bg {
  width: 100%;
  height: 100px;
}
</style>
