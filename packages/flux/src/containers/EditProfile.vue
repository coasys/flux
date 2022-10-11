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
        @input="(e) => (username = e.target.value)"
      ></j-input>
      <j-input
        size="lg"
        label="Bio"
        @keydown.enter="updateProfile"
        :value="bio"
        @input="(e) => (bio = e.target.value)"
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
import { getImage } from "utils/api/getProfile";

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
      profilePicture: "",
      username: "",
      bio: "",
      link: "",
      profileBg: "",
      profileBgChanged: false,
      bioChanged: false,
      hideContainer: false,
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
    "userProfile.profilePicture": {
      handler: async function (val: string) {
        if (this.userStore.profile?.profilePicture) {
          this.profilePicture =  await getImage(this.userStore.profile?.profilePicture)
        } else {
          this.profilePicture = '';
        }
      },
      immediate: true,
    },
    "userProfile.username": {
      handler: function (val: string): void {
        this.username = val;
      },
      immediate: true,
    },
    preBio() {
      this.bio = this.preBio;
    },
    bg() {
      this.profileBg = this.bg;
    },
    bio() {
      this.bioChanged = this.bio !== this.preBio;
    },
    profileBg() {
      this.profileBgChanged = this.profileBg !== this.bg;
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
