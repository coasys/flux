<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <div v-if="tabView === 'Create'">
        <j-text variant="heading">Create a community </j-text>
      </div>
      <div v-if="tabView === 'Join'">
        <j-text variant="heading">Join a community </j-text>
        <j-text color="danger-500">
          This is an early version of Junto with a remote code execution
          vulnerability. DO NOT join any community from somebody you do not know
          as its possible for people to use fake links to hack you!
        </j-text>
      </div>

      <j-tabs :value="tabView" @change="(e) => (tabView = e.target.value)">
        <j-tab-item size="lg" variant="button">Create</j-tab-item>
        <j-tab-item size="lg" variant="button">Join</j-tab-item>
      </j-tabs>
      <j-flex direction="column" gap="500" v-if="tabView === 'Create'">
        <avatar-upload
          :value="newProfileImage"
          @change="(val) => (newProfileImage = val)"
          icon="people-fill"
        />
        <j-input
          size="lg"
          label="Name"
          required
          autovalidate
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
          :disabled="isCreatingCommunity || !canSubmit"
          size="lg"
          variant="primary"
          @click="createCommunity"
        >
          Create Community
        </j-button>
      </j-flex>
      <j-flex direction="column" gap="500" v-if="tabView === 'Join'">
        <j-input
          :value="joiningLink"
          @keydown.enter="joinCommunity"
          @input="(e) => (joiningLink = e.target.value)"
          size="lg"
          label="Invite link"
        ></j-input>

        <j-button
          :disabled="isJoiningCommunity || !joiningLink"
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
  </j-box>
</template>

<script lang="ts">
import { isValid } from "@/utils/validation";
import { defineComponent } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import store from "@/store";

export default defineComponent({
  components: { AvatarUpload },
  emits: ["cancel", "submit"],
  data() {
    return {
      tabView: "Create",
      joiningLink: "",
      newCommunityName: "",
      newCommunityDesc: "",
      newProfileImage: "",
      isJoiningCommunity: false,
      isCreatingCommunity: false,
    };
  },
  computed: {
    canSubmit(): boolean {
      return isValid(
        [
          {
            check: (val: string) => (val ? false : true),
            message: "This field is required",
          },
        ],
        this.newCommunityName
      );
    },
  },
  methods: {
    joinCommunity() {
      this.isJoiningCommunity = true;
      store.dispatch
        .joinCommunity({ joiningLink: this.joiningLink })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isJoiningCommunity = false;
        });
    },
    createCommunity() {
      this.isCreatingCommunity = true;
      store.dispatch
        .createCommunity({
          perspectiveName: this.newCommunityName,
          description: this.newCommunityDesc,
          image: this.newProfileImage,
          thumbnail: this.newProfileImage,
        })
        .then((community) => {
          this.$emit("submit");
          this.newCommunityName = "";
          this.newCommunityDesc = "";
          this.newProfileImage = "";

          const channels = store.getters.getChannelNeighbourhoods(
            community.neighbourhood.perspective.uuid
          );

          this.$router.push({
            name: "channel",
            params: {
              communityId: community.neighbourhood.perspective.uuid,
              channelId: channels[0].perspective.uuid,
            },
          });
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
  },
});
</script>
