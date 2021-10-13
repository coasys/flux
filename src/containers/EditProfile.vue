<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
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
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "@/core/methods/createProfile";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { AvatarUpload },
  setup() {
    const userStore = useUserStore();

    return {
      userStore,
    };
  },
  data() {
    return {
      isUpdatingProfile: false,
      profilePicture: "",
      username: "",
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
      handler: function (val: string): void {
        this.profilePicture = val;
      },
      immediate: true,
    },
    "userProfile.username": {
      handler: function (val: string): void {
        this.username = val;
      },
      immediate: true,
    },
  },
  methods: {
    async updateProfile() {
      this.isUpdatingProfile = true;
      const resizedImage = this.profilePicture
        ? await resizeImage(dataURItoBlob(this.profilePicture as string), 400)
        : undefined;
      const thumbnail = this.profilePicture
        ? await blobToDataURL(resizedImage!)
        : undefined;

      this.userStore
        .updateProfile({
          username: this.username,
          profilePicture: this.profilePicture,
          thumbnail,
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
