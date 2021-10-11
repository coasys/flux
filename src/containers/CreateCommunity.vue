<template>
  <j-box pt="1000" pb="800" px="700" v-if="!tabView">
    <j-flex direction="column">
      <j-menu-item class="choice-button" size="xl" @click="tabView = 'Create'">
        <j-text variant="heading-sm">Create community</j-text>
        <j-text variant="body">
          Make a community and start inviting people
        </j-text>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </j-menu-item>
      <j-menu-item class="choice-button" size="xl" @click="tabView = 'Join'">
        <j-text variant="heading-sm">Join a community</j-text>
        <j-text variant="body"> Join an already existing community </j-text>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </j-menu-item>
    </j-flex>
  </j-box>

  <j-box p="800" v-if="tabView">
    <j-flex direction="column" gap="700">
      <j-button
        :disabled="isCreatingCommunity || isJoiningCommunity"
        variant="subtle"
        @click="tabView = ''"
      >
        Back
      </j-button>
      <div v-if="tabView === 'Create'">
        <j-flex direction="column" gap="500" v-if="!isCreatingCommunity">
          <avatar-upload
            :value="newProfileImage"
            @change="(val) => (newProfileImage = val)"
            icon="camera"
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
        <div v-if="isCreatingCommunity" style="text-align: center">
          <j-text variant="heading-sm">
            Please wait while your community is being created
          </j-text>
          <j-text variant="body">
            Right now this proccess might take a couple of minutes, so please be
            patient
          </j-text>
          <j-flex j="center">
            <j-spinner size="lg"></j-spinner>
          </j-flex>
        </div>
      </div>
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
import { useDataStore } from "@/store/data";

export default defineComponent({
  components: { AvatarUpload },
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      tabView: "",
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
      this.dataStore
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
      this.dataStore
        .createCommunity({
          perspectiveName: this.newCommunityName,
          description: this.newCommunityDesc,
          image: this.newProfileImage,
          thumbnail: this.newProfileImage,
        })
        .then((community: any) => {
          this.$emit("submit");
          this.newCommunityName = "";
          this.newCommunityDesc = "";
          this.newProfileImage = "";

          const channels = this.dataStore.getChannelNeighbourhoods(
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

<style scoped>
.choice-button {
  --j-menu-item-height: auto;
  --j-menu-item-padding: var(--j-space-500) var(--j-space-600);
}
</style>
