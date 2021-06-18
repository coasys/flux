<template>
  <j-flex direction="column" gap="700">
    <div v-if="tabView === 'Create'">
      <j-text variant="heading">Create a community </j-text>
    </div>
    <div v-if="tabView === 'Join'">
      <j-text variant="heading">Join a community </j-text>
      <j-text color="danger-500">
        This is an early version of Junto with a remote code execution
        vulnerability. DO NOT join any community from somebody you do not know
        as its possible for people to use fake joining links to hack you!
      </j-text>
    </div>

    <j-tabs
      size="lg"
      :value="tabView"
      @change="(e) => (tabView = e.target.value)"
    >
      <j-tab-item>Create</j-tab-item>
      <j-tab-item>Join</j-tab-item>
    </j-tabs>
    <j-flex direction="column" gap="500" v-if="tabView === 'Create'">
      <j-input
        size="lg"
        label="Name"
        @keydown.enter="createCommunity"
        @input="(e) => (newCommunityName = e.target.value)"
        :value="newCommunityName"
      ></j-input>
      <j-input
        size="lg"
        label="Description"
        :value="newCommunityDesc"
        @keydown.enter="createCommunity"
        @input="(e) => (newCommunityDesc = e.target.value)"
      ></j-input>

      <j-button
        full
        :loading="isCreatingCommunity"
        :disabled="isCreatingCommunity"
        size="lg"
        variant="primary"
        @click="createCommunity"
      >
        Create Community
      </j-button>
    </j-flex>
    <j-flex direction="column" gap="200" v-if="tabView === 'Join'">
      <j-input
        :value="joiningLink"
        @input="(e) => (joiningLink = e.target.value)"
        size="lg"
        label="Invite link"
      ></j-input>

      <j-button
        :disabled="isJoiningCommunity"
        :loading="isJoiningCommunity"
        @click="joinCommunity"
        size="lg"
        full
        variant="primary"
      >
        Join Community
      </j-button>
    </j-flex>
  </j-flex>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      tabView: "Create",
      joiningLink: "",
      newCommunityName: "",
      newCommunityDesc: "",
      isJoiningCommunity: false,
      isCreatingCommunity: false,
    };
  },
  methods: {
    joinCommunity() {
      this.isJoiningCommunity = true;
      this.$store
        .dispatch("joinCommunity", { joiningLink: this.joiningLink })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isJoiningCommunity = false;
        });
    },
    createCommunity() {
      this.isCreatingCommunity = true;
      this.$store
        .dispatch("createCommunity", {
          perspectiveName: this.newCommunityName,
          description: this.newCommunityDesc,
        })
        .then(() => {
          this.$emit("submit");
          this.newCommunityName = "";
          this.newCommunityDesc = "";
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
  },
});
</script>
