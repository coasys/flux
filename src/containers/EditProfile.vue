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
        :value="tempUser.profilePicture"
        @change="(url) => (tempUser.profilePicture = url)"
      ></avatar-upload>
      <j-input
        size="lg"
        label="Username"
        @keydown.enter="updateProfile"
        :value="tempUser.username"
        @input="(e) => (tempUser.username = e.target.value)"
      ></j-input>
      <j-input
        size="lg"
        label="Bio"
        @keydown.enter="updateProfile"
        :value="tempUser.bio"
        @input="(e) => (tempUser.bio = e.target.value)"
      ></j-input>
      <div>
        <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
        <j-button size="lg" variant="primary" @click="updateProfile">
          Save
        </j-button>
      </div>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { defineComponent } from "vue";
import { Profile } from "@/store/types";
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
import ImgUpload from "@/components/img-upload/ImgUpload.vue";

export default defineComponent({
  emits: ["cancel", "submit"],
  props: ["bg", "preBio"],
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
      tempUser: {
        username: "",
        email: "",
        givenName: "",
        familyName: "",
        profilePicture: "",
        thumbnailPicture: "",
        bio: "",
      },
    };
  },
  computed: {
    userProfile(): Profile {
      return this.userStore.profile!;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
  },
  watch: {
    userProfile: {
      handler: function (userProfile: Profile) {
        this.tempUser = { ...this.tempUser, ...userProfile };
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    async updateProfile() {
      this.isUpdatingProfile = true;
      this.userStore.updateProfile(this.tempUser);
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
