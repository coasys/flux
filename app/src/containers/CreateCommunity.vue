<template>
  <j-box pt="600" pb="800" px="400" v-if="!tabView">
    <j-box pb="500">
      <j-text variant="heading-sm">Add a Community</j-text>
    </j-box>
    <div class="options">
      <button class="option" size="xl" @click="tabView = 'Create'">
        <j-icon slot="start" name="file-plus" size="xl"></j-icon>
        <div class="option-body">
          <j-text variant="heading-sm">Create a Community</j-text>
          <j-text variant="body" nomargin>
            Make a community and start inviting people
          </j-text>
        </div>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </button>
      <button class="option" size="xl" @click="tabView = 'Join'">
        <j-icon slot="start" name="files" size="xl"></j-icon>
        <div class="option-body">
          <j-text variant="heading-sm">Join a Community</j-text>
          <j-text variant="body" nomargin>
            Join an already existing community
          </j-text>
        </div>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </button>
      <button class="option" size="xl" @click="tabView = 'Load'">
        <j-icon slot="start" name="file-arrow-up" size="xl"></j-icon>
        <div class="option-body">
          <j-text variant="heading-sm">Load a Community</j-text>
          <j-text variant="body" nomargin
            >Load a existing perspective as community</j-text
          >
        </div>
        <j-icon slot="end" name="chevron-right"></j-icon>
      </button>
      <button
        v-if="!hasAlreadyJoinedTestingCommunity"
        class="option"
        size="xl"
        variant="secondary"
        @click="joinTestingCommunity"
      >
        <j-icon
          slot="start"
          color="primary-700"
          name="stars"
          size="xl"
        ></j-icon>
        <div class="option-body">
          <j-text variant="heading-sm" color="primary-800"
            >Join Testing Community</j-text
          >
          <j-text variant="body" nomargin
            >Try the Flux Alpha testing community</j-text
          >
        </div>
        <j-icon slot="end" name="plus-lg"></j-icon>
      </button>
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
          <div>
            <j-text variant="label">Select a strategy</j-text>
            <select
              class="select"
              @change="(e) => (selectedLang = e.target.value)"
              :value="selectedLang"
              size="lg"
              label="Select Language"
              placeholder="Select a language"
            >
              <option :value="meta.address" v-for="(meta, index) in langMeta">
                <template v-if="index === 0">Full P2P Badass</template>
                <template v-else-if="index === 1">Hybrid P2P</template>
                <template v-if="index === 2">Centralized</template>
                <template v-else> {{ meta.description }}</template>
              </option>
            </select>
          </div>
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
            Your community is being created
          </j-text>
          <j-text variant="body">
            Please be patient, this might take a while right now.
          </j-text>
          <j-box pt="500">
            <j-flex j="center">
              <HourGlass width="50" />
            </j-flex>
          </j-box>
        </div>
      </div>
      <j-flex direction="column" gap="500" v-if="tabView === 'Join'">
        <j-input
          :value="joiningLink"
          @keydown.enter="joinCommunity"
          @input="(e: any) => (joiningLink = e.target.value)"
          @change="(e: any) => cleanInviteLink(e.target.value)"
          size="lg"
          label="Invite link"
        ></j-input>

        <j-button
          :disabled="isJoiningCommunity || !canJoin"
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
          <j-text
            variant="body"
            v-if="Object.keys(nonFluxCommunities).length === 0"
            >No perspective found that is not a flux community</j-text
          >
          <j-menu-item
            v-for="perspective in nonFluxCommunities"
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
      <div v-if="tabView === 'Test'">
        <div style="text-align: center">
          <j-text variant="heading-sm">
            Please wait while you join the testing community
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
import { defineComponent, ref } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { Ad4mClient, PerspectiveProxy } from "@coasys/ad4m";
import { useAppStore } from "@/store/app";
import { joinCommunity, createCommunity } from "@coasys/flux-api";
import { usePerspectives, useCommunities } from "@coasys/flux-vue";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import HourGlass from "@/components/hourglass/Hourglass.vue";

export default defineComponent({
  components: { AvatarUpload, HourGlass },
  emits: ["cancel", "submit"],
  async setup() {
    const appStore = useAppStore();

    return {
      selectedLang: ref<any>(null),
      langMeta: ref<any>(null),
      communities: [],
      perspectives: [],
      appStore,
    };
  },
  async mounted() {
    const client: Ad4mClient = await getAd4mClient();

    const linkLangs = await client.runtime.knownLinkLanguageTemplates();
    const langExpression = await client.expression.getMany(
      linkLangs.map((l) => `lang://${l}`)
    );

    const langMeta = langExpression
      .map((l) => JSON.parse(l.data));

    // const langMeta = langExpression
    //   .map((l) => JSON.parse(l.data))
    //   .filter((l) => !l.description.includes("Holochain"));
    const { perspectives, neighbourhoods } = usePerspectives(client);
    const { communities } = useCommunities(neighbourhoods);

    this.selectedLang = langMeta[0].address;
    this.langMeta = langMeta;
    // @ts-ignore
    this.communities = communities;
    // @ts-ignore
    this.perspectives = perspectives;
  },
  data() {
    return {
      tabView: "",
      joiningLink: "",
      newCommunityName: "",
      newCommunityDesc: "",
      newProfileImage: undefined,
      isJoiningCommunity: false,
      isCreatingCommunity: false,
    };
  },
  computed: {
    nonFluxCommunities(): Record<string, PerspectiveProxy> {
      console.log({ c: this.communities, p: this.perspectives });
      return Object.entries(this.perspectives).reduce(
        (acc, [uuid, perspective]) => {
          const perspectiveIsCommunity = Object.keys(this.communities).some(
            (id) => uuid === id
          );

          if (!perspectiveIsCommunity)
            return {
              ...acc,
              [uuid]: perspective,
            };
          return acc;
        },
        {}
      );
    },
    hasAlreadyJoinedTestingCommunity(): boolean {
      const p = Object.values(this.perspectives).find(
        (p) => p.uuid === DEFAULT_TESTING_NEIGHBOURHOOD
      );
      return p ? true : false;
    },
    canJoin(): boolean {
      return isValid(
        [
          {
            check: (val: string) => {
              const regex = /neighbourhood:\/\/[^\s]*/;
              return !regex.test(val);
            },
            message: "This is not a valid neighbourhood link",
          },
        ],
        this.joiningLink
      );
    },
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
    cleanInviteLink(text: string) {
      const regex = /neighbourhood:\/\/[^\s]*/;
      const neighbourhoodUrlMatch = text.match(regex) || [""];
      const match = neighbourhoodUrlMatch[0];
      this.joiningLink = match;
      if (text && !match) {
        this.appStore.setToast({
          variant: "error",
          message: "We were not able to parse this invite link",
          open: true,
        });
      }
    },
    async joinCommunity() {
      const client = await getAd4mClient();
      this.isJoiningCommunity = true;

      const neighbourhoodUrl = this.joiningLink;

      const existingPerspective = Object.values(this.perspectives).find(
        (p) => p.sharedUrl === neighbourhoodUrl
      );

      if (existingPerspective) {
        this.appStore.setToast({
          variant: "error",
          message: "You are already a member of this community",
          open: true,
        });
        this.isJoiningCommunity = false;
        this.appStore.setShowCreateCommunity(false);
        return;
      }

      joinCommunity({ joiningLink: neighbourhoodUrl })
        .then((community) => {
          this.$emit("submit");
          this.$router.push({
            name: "community",
            params: {
              communityId: community.uuid,
            },
          });
        })
        .finally(async () => {
          this.isJoiningCommunity = false;
        });
    },
    createCommunity() {
      this.isCreatingCommunity = true;

      createCommunity({
        linkLangAddress: this.selectedLang,
        name: this.newCommunityName,
        description: this.newCommunityDesc,
        image: this.newProfileImage,
      })
        .then((community) => {
          this.$emit("submit");
          this.newCommunityName = "";
          this.newCommunityDesc = "";
          this.newProfileImage = undefined;

          this.$router.push({
            name: "community",
            params: {
              communityId: community.uuid,
            },
          });
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
    createCommunityFromPerspective(perspective: any) {
      this.isCreatingCommunity = true;
      createCommunity({
        name: perspective.name,
        description: this.newCommunityDesc,
        image: this.newProfileImage,
        perspectiveUuid: perspective.uuid,
      })
        .then(() => {
          this.$emit("submit");

          this.$router.push({
            name: "community",
            params: {
              communityId: perspective.uuid,
            },
          });
        })
        .finally(() => {
          this.isCreatingCommunity = false;
        });
    },
    async joinTestingCommunity() {
      try {
        this.tabView = "Test";
        await this.appStore.joinTestingCommunity();
      } catch (e) {
        console.log(e);
      } finally {
        this.$emit("cancel");
      }
    },
  },
});
</script>

<style scoped>
.select {
  width: 100%;
  height: var(--j-size-lg);
  padding-left: var(--j-space-300);
  padding-right: var(--j-space-300);
  font-size: inherit;
  font-family: inherit;
  background-color: transparent;
  color: var(--j-color-black);
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-color-primary-100);
}

.select:hover {
  border: 1px solid var(--j-color-primary-200);
}

.select:focus {
  outline: 0;
  border: 1px solid var(--j-color-primary-500);
}
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
  text-align: left;
  color: currentColor;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-500);
  gap: var(--j-space-500);
}

.option-body {
  flex: 1;
  line-height: 1.4;
}

.option:hover {
  border: 1px solid var(--j-color-primary-500);
}

.option:active {
  border: 1px solid var(--j-color-primary-500);
}

.option[variant="secondary"] {
  background: var(--j-color-primary-100);
  border: 1px solid var(--j-color-primary-300);
}

.option[variant="secondary"]:hover {
  border: 1px solid var(--j-color-primary-500);
}
</style>
