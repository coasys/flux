<template>
  <j-box pt="600" pb="800" px="400" v-if="!tabView">
    <j-box pb="500">
      <j-text variant="heading-sm">Add a Community</j-text>
    </j-box>
    <div class="options">
      <div class="option" size="xl" @click="tabView = 'Create'">
        <div>
          <j-text variant="heading-sm">Create a community</j-text>
          <j-text variant="body">
            Make a community and start inviting people
          </j-text>
        </div>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </div>
      <div class="option" size="xl" @click="tabView = 'Join'">
        <div>
          <j-text variant="heading-sm">Join a community</j-text>
          <j-text variant="body"> Join an already existing community </j-text>
        </div>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </div>
      <div class="option" size="xl" @click="tabView = 'Load'">
        <div>
          <j-text variant="heading-sm">Load a community</j-text>
          <j-text variant="body"
            >Load a existing perspective as community</j-text
          >
        </div>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </div>
    </div>
  </j-box>

  <j-box p="800" v-if="tabView">
    <j-flex direction="column" gap="700">
      <j-button
        :disabled="isCreatingCommunity || isJoiningCommunity"
        variant="link"
        @click="tabView = ''"
      >
        <j-icon name="arrow-left-short" />
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
            @input="(e: any) => (newCommunityName = e.target.value)"
            :value="newCommunityName"
          ></j-input>
          <j-input
            size="lg"
            label="Description"
            :value="newCommunityDesc"
            @keydown.enter="createCommunity"
            @input="(e: any) => (newCommunityDesc = e.target.value)"
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
          @input="(e: any) => (joiningLink = e.target.value)"
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
      <div v-if="tabView === 'Load'">
        <j-flex direction="column" gap="500" v-if="!isCreatingCommunity">
          <j-text variant="body" v-if="nonFluxPerspectives.length === 0"
            >No perspective found that is not a flux community</j-text
          >
          <j-menu-item
            v-for="perspective of nonFluxPerspectives"
            :key="perspective.uuid"
            class="choice-button"
            size="xl"
            @click="createCommunityFromPerspective(perspective)"
          >
            <j-text variant="heading-sm">{{ perspective.name }}</j-text>
            <j-icon slot="end" name="chevron-right"></j-icon>
          </j-menu-item>
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
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { isValid } from "@/utils/validation";
import { defineComponent } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { useDataStore } from "@/store/data";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CommunityState } from "@/store/types";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useAppStore } from "@/store/app";

export default defineComponent({
  components: { AvatarUpload },
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();
    const appStore = useAppStore();

    return {
      dataStore,
      appStore
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
      nonFluxPerspectives: [] as PerspectiveProxy[],
    };
  },
  mounted() {
    this.getPerspectives();
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
    async joinCommunity() {
      const client = await getAd4mClient();
      this.isJoiningCommunity = true;

      const regex = /neighbourhood:\/\/[^\s]*/;
      const neighbourhoodUrlMatch = this.joiningLink.match(regex);
      if (!neighbourhoodUrlMatch) {
        this.appStore.setToast({variant: "error", message: "We were not able to parse this invite link", open: true});
        this.isJoiningCommunity = false;
        return;
      }
      const neighbourhoodUrl = neighbourhoodUrlMatch[0];
      console.log(neighbourhoodUrl);

      const existingPerspective = (await client.perspective.all()).filter((perspective) => {
        return perspective.sharedUrl === neighbourhoodUrl;
      });

      if (existingPerspective.length != 0) {
        this.appStore.setToast({variant: "error", message: "You are already a member of this community", open: true});
        this.isJoiningCommunity = false;
        this.appStore.setShowCreateCommunity(false);

        const community = await this.dataStore.getCommunityByNeighbourhoodUrl(neighbourhoodUrl);

        if (!community) {
          console.error("Did not find community when trying to redirect after join");
          return;
        }

        this.$router.push({
          name: "community",
          params: {
            communityId: community.neighbourhood.uuid
          },
        });
        return;
      }

      this.dataStore
        .joinCommunity({ joiningLink: neighbourhoodUrl })
        .then(() => {
          this.$emit("submit");
        })
        .finally(async () => {
          this.isJoiningCommunity = false;

          const community = await this.dataStore.getCommunityByNeighbourhoodUrl(neighbourhoodUrl);

          if (!community) {
            console.error("Did not find community when trying to redirect after join");
            return;
          }

          this.$router.push({
            name: "community",
            params: {
              communityId: community.neighbourhood.uuid
            },
          });
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
        .then((community: CommunityState) => {
          this.$emit("submit");
          this.newCommunityName = "";
          this.newCommunityDesc = "";
          this.newProfileImage = "";

          const channels = this.dataStore.getChannelStates(
            community.neighbourhood.uuid
          );

          this.$router.push({
            name: "channel",
            params: {
              communityId: community.neighbourhood.uuid,
              channelId: channels[0].id,
            },
          });
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
    createCommunityFromPerspective(perspective: any) {
      this.isCreatingCommunity = true;
      this.dataStore
        .createCommunity({
          perspectiveName: perspective.name,
          description: this.newCommunityDesc,
          image: this.newProfileImage,
          thumbnail: this.newProfileImage,
          perspectiveUuid: perspective.uuid,
        })
        .then((community: any) => {
          this.$emit("submit");
          const channels = this.dataStore.getChannelStates(
            community.neighbourhood.uuid
          );

          this.$router.push({
            name: "channel",
            params: {
              communityId: community.neighbourhood.uuid,
              channelId: channels[0].id,
            },
          });
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
    async getPerspectives() {
      const client = await getAd4mClient();
      const keys = Object.keys(this.dataStore.neighbourhoods);
      const perspectives = await client.perspective.all();

      const nonFluxPerspectives = perspectives.filter(
        (perspective) => !keys.includes(perspective.uuid)
      );

      //@ts-ignore
      this.nonFluxPerspectives = nonFluxPerspectives.map((perspective) => {
        return {
          name: perspective.name,
          neighbourhood: perspective.neighbourhood,
          sharedUrl: perspective.sharedUrl,
          uuid: perspective.uuid,
        };
      });
    },
  },
});
</script>

<style scoped>
.options {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--j-space-500);
}

.option {
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2px solid transparent;
  background-color: var(--j-color-ui-50);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-500);
}

.option:hover {
  border: 2px solid var(--j-color-ui-100);
}

.option:active {
  border: 2px solid var(--j-color-primary-500);
}
</style>
