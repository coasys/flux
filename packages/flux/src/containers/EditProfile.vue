<template>
  <j-box p="800" :style="{ display: hideContainer ? 'none' : 'block' }">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
      <img-upload
        :value="profileBg"
        @change="(url) => (profileBg = url)"
        @hide="(val) => (hideContainer = val)"
      ></img-upload>
      <avatar-upload
        :hash="userDid"
        :value="profilePicture"
        @change="(url) => (profilePicture = url)"
      ></avatar-upload>
      <j-input
        size="lg"
        label="Username"
        @keydown.enter="updateProfile"
        :value="userProfile?.username"
        @input="(e: any) => (username = e.target.value)"
      ></j-input>
      <j-input
        size="lg"
        label="Bio"
        @keydown.enter="updateProfile"
        :value="bio"
        @input="(e: any) => (bio = e.target.value)"
      ></j-input>
      <div>
        <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
        <j-button
          :disabled="isUpdatingProfile"
          size="lg"
          :loading="isUpdatingProfile"
          variant="primary"
          @click="updateProfile"
        >
          Save
        </j-button>
      </div>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { defineComponent } from "vue";
import { Profile } from "utils/types";
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
import ImgUpload from "@/components/img-upload/ImgUpload.vue";
import { getImage } from "utils/api/getProfile";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { AvatarUpload, ImgUpload },
  setup() {
    const userStore = useUserStore();
    const appStore = useAppStore();
    return {
      userStore,
      appStore,
    };
  },
  data() {
    return {
      isUpdatingProfile: false,
      username: "",
      bio: "",
      profileBg: "",
      profilePicture: "",
      hideContainer: false,
    };
  },
  async mounted() {
    this.username = this.userProfile.username || "";
    this.bio = this.userProfile.bio || "";
    this.profilePicture = await getImage(this.userProfile?.profilePicture);
    this.profileBg = await getImage(this.userProfile.profileBg);
  },
  computed: {
    userProfile(): Profile {
      return this.userStore.profile!;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
  },
  methods: {
    async updateProfile() {
      this.isUpdatingProfile = true;

      this.userStore
        .updateProfile({
          username: this.username,
          profilePicture: this.profilePicture,
          bio: this.bio,
          profileBg: this.profileBg,
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isUpdatingProfile = false;
        });
    },
  },
});
</script>

<style scoped>
.profile_bg {
  width: 100%;
  height: 100px;
}
</style>
