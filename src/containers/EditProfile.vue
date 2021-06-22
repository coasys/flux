<template>
  <j-flex direction="column" gap="700">
    <j-text variant="heading">Edit profile</j-text>
    <avatar-upload
      :value="profilePicture"
      @change="(url) => (profilePicture = url)"
    ></avatar-upload>
    <j-input
      size="lg"
      label="Username"
      @keydown.enter="updateUser"
      :value="userProfile?.username"
      @input="(e) => (username = e.target.value)"
    ></j-input>
    <div>
      <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
      <j-button size="lg" variant="primary" @click="updateUser">
        Save
      </j-button>
    </div>
  </j-flex>
</template>

<script lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { defineComponent } from "vue";
import { Profile } from "@/store";

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
      return this.$store.state.userProfile || {};
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
    updateUser() {
      this.isUpdatingProfile = true;
      this.$store
        .dispatch("updateUser", {
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
