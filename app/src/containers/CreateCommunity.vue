<template>
  <j-box pt="600" pb="800" px="400" v-if="!tabView">
    <j-box pb="500">
      <j-text variant="heading-sm">Add a Community</j-text>
    </j-box>
    <div class="options">
      <button class="option" size="xl" @click="tabView = 'Create'">
        <j-icon slot="start" name="file-plus" size="xl" />
        <div class="option-body">
          <j-text variant="heading-sm">Create a Community</j-text>
          <j-text variant="body" nomargin> Make a community and start inviting people </j-text>
        </div>
        <j-icon slot="end" name="chevron-right" />
      </button>
      <button class="option" size="xl" @click="tabView = 'Join'">
        <j-icon slot="start" name="files" size="xl" />
        <div class="option-body">
          <j-text variant="heading-sm">Join a Community</j-text>
          <j-text variant="body" nomargin> Join an already existing community </j-text>
        </div>
        <j-icon slot="end" name="chevron-right" />
      </button>
      <button class="option" size="xl" @click="tabView = 'Load'">
        <j-icon slot="start" name="file-arrow-up" size="xl" />
        <div class="option-body">
          <j-text variant="heading-sm">Load a Community</j-text>
          <j-text variant="body" nomargin>Load a existing perspective as community</j-text>
        </div>
        <j-icon slot="end" name="chevron-right" />
      </button>
      <button
        v-if="!hasAlreadyJoinedTestingCommunity"
        class="option"
        size="xl"
        variant="secondary"
        @click="joinTestingCommunity"
      >
        <j-icon slot="start" color="primary-700" name="stars" size="xl" />
        <div class="option-body">
          <j-text variant="heading-sm" color="primary-800">Join Testing Community</j-text>
          <j-text variant="body" nomargin>Try the Flux Alpha testing community</j-text>
        </div>
        <j-icon slot="end" name="plus-lg" />
      </button>
    </div>
  </j-box>

  <j-box p="800" v-if="tabView">
    <j-flex direction="column" gap="700">
      <j-button :disabled="isCreatingCommunity || isJoiningCommunity" variant="link" @click="tabView = ''">
        <j-icon name="arrow-left-short" />
        Back
      </j-button>
      <div v-if="tabView === 'Create'">
        <j-flex direction="column" gap="500" v-if="!isCreatingCommunity">
          <AvatarUpload
            :value="newProfileImage"
            @change="(val: string | null) => (newProfileImage = val || undefined)"
            icon="camera"
          />
          <j-input
            size="lg"
            label="Name"
            required
            autovalidate
            @keydown.enter="createCommunityMethod"
            @input="(e: any) => (newCommunityName = e.target.value)"
            :value="newCommunityName"
          />
          <j-input
            size="lg"
            label="Description"
            :value="newCommunityDesc"
            @keydown.enter="createCommunityMethod"
            @input="(e: any) => (newCommunityDesc = e.target.value)"
          />
          <div>
            <j-text variant="label">Select a strategy</j-text>
            <select
              class="select"
              @change="(e: any) => (selectedLang = e.target.value)"
              :value="selectedLang"
              size="lg"
              label="Select Language"
              placeholder="Select a language"
            >
              <option :value="meta.address" v-for="(meta, index) in langMeta" :key="meta.address">
                <!-- <template v-if="index === 0">Full P2P Badass</template> -->
                <!-- <template v-else-if="index === 1">Hybrid P2P</template> -->
                <!-- <template v-if="index === 2">Centralized</template> -->
                {{ meta.description }}
              </option>
            </select>
          </div>
          <j-button
            full
            :loading="isCreatingCommunity"
            :disabled="isCreatingCommunity || !canSubmit"
            size="lg"
            variant="primary"
            @click="createCommunityMethod"
          >
            Create Community
          </j-button>
        </j-flex>
        <div v-if="isCreatingCommunity" style="text-align: center">
          <j-text variant="heading-sm"> Your community is being created </j-text>
          <j-text variant="body"> Please be patient, this might take a while right now. </j-text>
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
          @keydown.enter="joinCommunityMethod"
          @input="(e: any) => (joiningLink = e.target.value)"
          @change="(e: any) => cleanInviteLink(e.target.value)"
          size="lg"
          label="Invite link"
        />

        <j-button
          :disabled="isJoiningCommunity || !canJoin"
          :loading="isJoiningCommunity"
          @click="joinCommunityMethod"
          size="lg"
          full
          variant="primary"
        >
          Join Community
        </j-button>
      </j-flex>
      <div v-if="tabView === 'Load'">
        <j-flex direction="column" gap="500" v-if="!isCreatingCommunity">
          <j-text variant="body" v-if="Object.keys(nonFluxCommunities).length === 0">
            No perspective found that is not a flux community
          </j-text>
          <j-menu-item
            v-for="perspective in nonFluxCommunities"
            :key="perspective.uuid"
            class="choice-button"
            size="xl"
            @click="createCommunityFromPerspective(perspective)"
          >
            <j-text variant="heading-sm">{{ perspective.name }}</j-text>
            <j-icon slot="end" name="chevron-right" />
          </j-menu-item>
        </j-flex>
        <div v-if="isCreatingCommunity" style="text-align: center">
          <j-text variant="heading-sm"> Please wait while your community is being created </j-text>
          <j-text variant="body"> Right now this proccess might take a couple of minutes, so please be patient </j-text>
          <j-flex j="center">
            <j-spinner size="lg" />
          </j-flex>
        </div>
      </div>
      <div v-if="tabView === 'Test'">
        <div style="text-align: center">
          <j-text variant="heading-sm"> Please wait while you join the testing community </j-text>
          <j-text variant="body"> Right now this proccess might take a couple of minutes, so please be patient </j-text>
          <j-flex j="center">
            <j-spinner size="lg" />
          </j-flex>
        </div>
      </div>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import HourGlass from "@/components/hourglass/Hourglass.vue";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { useAppStore, useModalStore } from "@/stores";
import { isValid } from "@/utils/validation";
import { Ad4mClient, PerspectiveProxy } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { usePerspectives } from "@coasys/ad4m-vue-hooks";
import { createCommunity, joinCommunity } from "@coasys/flux-api";
import { useCommunities } from "@coasys/flux-vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const emit = defineEmits<{ cancel: []; submit: [] }>();

const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();

const tabView = ref("");
const joiningLink = ref("");
const newCommunityName = ref("");
const newCommunityDesc = ref("");
const newProfileImage = ref<string | undefined>(undefined);
const isJoiningCommunity = ref(false);
const isCreatingCommunity = ref(false);
const selectedLang = ref<any>(null);
const langMeta = ref<any>(null);
const communities = ref<any>({});
const perspectives = ref<Record<string, PerspectiveProxy>>({});

const nonFluxCommunities = computed((): Record<string, PerspectiveProxy> => {
  return Object.entries(perspectives.value).reduce((acc, [uuid, perspective]) => {
    const perspectiveIsCommunity = Object.keys(communities.value).some((id) => uuid === id);
    if (!perspectiveIsCommunity) return { ...acc, [uuid]: perspective };
    return acc;
  }, {});
});

const hasAlreadyJoinedTestingCommunity = computed((): boolean => {
  const p = Object.values(perspectives.value).find((p: PerspectiveProxy) => p.uuid === DEFAULT_TESTING_NEIGHBOURHOOD);
  return p ? true : false;
});

const canJoin = computed((): boolean => {
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
    joiningLink.value
  );
});

const canSubmit = computed((): boolean => {
  return isValid(
    [{ check: (val: string) => (val ? false : true), message: "This field is required" }],
    newCommunityName.value
  );
});

function cleanInviteLink(text: string) {
  const regex = /neighbourhood:\/\/[^\s]*/;
  const neighbourhoodUrlMatch = text.match(regex) || [""];
  const match = neighbourhoodUrlMatch[0];
  joiningLink.value = match;
  if (text && !match) {
    appStore.setToast({ variant: "error", message: "We were not able to parse this invite link", open: true });
  }
}

async function joinCommunityMethod() {
  isJoiningCommunity.value = true;

  const neighbourhoodUrl = joiningLink.value;

  const existingPerspective = Object.values(perspectives.value).find(
    (p: PerspectiveProxy) => p.sharedUrl === neighbourhoodUrl
  );

  if (existingPerspective) {
    appStore.setToast({ variant: "error", message: "You are already a member of this community", open: true });
    isJoiningCommunity.value = false;
    modalStore.showCreateCommunity = false;
    return;
  }

  joinCommunity({ joiningLink: neighbourhoodUrl })
    .then((community) => {
      emit("submit");
      router.push({ name: "community", params: { communityId: community.uuid } });
    })
    .finally(async () => {
      isJoiningCommunity.value = false;
    });
}

function createCommunityMethod() {
  isCreatingCommunity.value = true;

  createCommunity({
    linkLangAddress: selectedLang.value,
    name: newCommunityName.value,
    description: newCommunityDesc.value,
    image: newProfileImage.value,
  })
    .then((community) => {
      emit("submit");
      newCommunityName.value = "";
      newCommunityDesc.value = "";
      newProfileImage.value = undefined;

      // Refresh my communities in the app store
      appStore.getMyCommunities();

      // Navigate to the new community
      router.push({ name: "community", params: { communityId: community.uuid } });
    })
    .catch((error) => {
      console.error("Error creating community:", error);
      appStore.setToast({ variant: "error", message: "Failed to create community. Please try again.", open: true });
    })
    .finally(() => {
      isCreatingCommunity.value = false;
    });
}

function createCommunityFromPerspective(perspective: any) {
  isCreatingCommunity.value = true;
  createCommunity({
    name: perspective.name,
    description: newCommunityDesc.value,
    image: newProfileImage.value,
    perspectiveUuid: perspective.uuid,
  })
    .then(() => {
      emit("submit");
      router.push({ name: "community", params: { communityId: perspective.uuid } });
    })
    .finally(() => {
      isCreatingCommunity.value = false;
    });
}

async function joinTestingCommunity() {
  try {
    tabView.value = "Test";
    await appStore.joinTestingCommunity();
  } catch (e) {
    console.log(e);
  } finally {
    emit("cancel");
  }
}

onMounted(async () => {
  const client: Ad4mClient = await getAd4mClient();

  const linkLangs = await client.runtime.knownLinkLanguageTemplates();
  const langExpression = await client.expression.getMany(linkLangs.map((l) => `lang://${l}`));

  const langMetaData = langExpression.map((l) => JSON.parse(l.data));

  const { perspectives: perspectivesData, neighbourhoods } = usePerspectives(client);
  const { communities: communitiesData } = useCommunities(neighbourhoods);

  selectedLang.value = langMetaData[0].address;
  langMeta.value = langMetaData;
  communities.value = communitiesData;
  perspectives.value = perspectivesData.value;
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
