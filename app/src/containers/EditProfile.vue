<template>
  <j-box p="800" :style="{ display: hideContainer ? 'none' : 'block' }">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
      <img-upload
        :value="profileBackground"
        @change="(url) => (profileBackground = url)"
        @hide="(val) => (hideContainer = val)"
      ></img-upload>
      <avatar-upload
        :hash="agent?.did"
        :value="profilePicture"
        @change="(url) => (profilePicture = url)"
      ></avatar-upload>
      <j-input
        size="lg"
        label="Username"
        @keydown.enter="updateProfile"
        :value="profile?.username"
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
import { useAppStore } from "@/store/app";
import ImgUpload from "@/components/img-upload/ImgUpload.vue";
import { useMe } from "@fluxapp/vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { AvatarUpload, ImgUpload },
  async setup() {
    const appStore = useAppStore();
    const client = await getAd4mClient();
    const { profile, agent } = useMe(client.agent);
    return {
      agent,
      profile,
      appStore,
    };
  },
  data() {
    return {
      isUpdatingProfile: false,
      username: "",
      bio: "",
      profileBackground: "",
      profilePicture: "",
      hideContainer: false,
    };
  },
  async mounted() {
    this.username = this.profile?.username || "";
    this.bio = this.profile?.bio || "";
    this.profilePicture = this.profile?.profilePicture || "";
    this.profileBackground = this.profile?.profileBackground || "";
  },
  methods: {
    async updateProfile() {
      this.isUpdatingProfile = true;

      // TODO: Update user profile

      // this.userStore
      //   .updateProfile({
      //     username: this.username,
      //     profilePicture: this.profilePicture,
      //     bio: this.bio,
      //     profileBackground: this.profileBackground,
      //   })
      //   .then(() => {
      //     this.$emit("submit");
      //   })
      //   .finally(() => {
      //     this.isUpdatingProfile = false;
      //   });
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
