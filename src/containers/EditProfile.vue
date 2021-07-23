<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <j-text variant="heading">Edit profile</j-text>
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
import store from "@/store";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { AvatarUpload },
  data() {
    return {
      isUpdatingProfile: false,
      profilePicture: "",
      username: "",
    };
  },
  computed: {
    userProfile(): Profile {
      return store.state.user.profile!;
    },
    userDid(): string {
      return store.state.user.agent.did!;
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
    updateProfile() {
      this.isUpdatingProfile = true;
      store.dispatch
        .updateProfile({
          username: this.username,
          profilePicture: this.profilePicture,
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
