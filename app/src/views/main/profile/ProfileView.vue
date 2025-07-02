<template>
  <div v-if="profile" class="profile__container">
    <div :style="{ backgroundImage: `url('${profile?.profileBackground}')` }" class="profile__bg" />

    <div class="profile">
      <div class="profile__layout">
        <div class="profile__info">
          <div class="profile__avatar">
            <div class="avatar-wrapper" @click="() => (modalsStore.showEditProfile = true)">
              <j-avatar class="avatar" :hash="did" :src="profile?.profilePicture" />
              <div class="avatar-hover">
                <j-icon name="pen" />
              </div>
            </div>

            <j-button v-if="sameAgent" variant="ghost" @click="() => (modalsStore.showEditProfile = true)">
              <j-icon size="sm" name="pen" />
            </j-button>
          </div>

          <j-box pt="400" pb="300">
            <j-text nomargin v-if="profile.familyName || profile.givenName" variant="heading-sm">
              {{ `${profile.givenName} ${profile.familyName}` }}
            </j-text>
            <j-text nomargin size="500" weight="500" color="ui-500"> @{{ profile.username }} </j-text>
          </j-box>

          <j-box pt="400">
            <j-text nomargin size="500" color="ui-800" v-if="profile.bio">
              {{ profile.bio || "No bio yet" }}
            </j-text>
          </j-box>
        </div>

        <div class="profile__content">
          <j-box my="500">
            <j-tabs class="tabs" @change="(e: any) => (currentTab = e.target.value)" :value="currentTab">
              <j-tab-item value="web2">Web2</j-tab-item>
              <j-tab-item value="web3">Web3</j-tab-item>
            </j-tabs>

            <div v-show="currentTab === 'web2'">
              <j-box py="500" a="right">
                <j-button v-if="sameAgent" variant="primary" @click="() => (showAddlinkModal = true)">
                  Add Link
                </j-button>
              </j-box>
              <div class="profile__links">
                <WebLinkCard
                  v-for="(link, i) in weblinks"
                  :key="i"
                  :id="link.id"
                  :url="link.url"
                  :title="link.title"
                  :description="link.description"
                  :image="link.image"
                  :sameAgent="sameAgent"
                  @edit="() => setEditLinkModal(true, link)"
                  @delete="() => deleteWebLink(link)"
                />
              </div>
            </div>
            <div v-show="currentTab === 'web3'">
              <j-box pt="500">
                <div class="wallets">
                  <div
                    class="wallet"
                    :class="{ selected: selectedAddress === proof.deviceKey }"
                    :key="proof.deviceKey"
                    @click="() => (selectedAddress = proof.deviceKey)"
                    v-for="(proof, i) in proofs"
                  >
                    <div class="wallet__avatar" v-html="getIcon(proof.deviceKey)"></div>
                    <j-badge size="sm" variant="primary">
                      <j-icon
                        size="xs"
                        v-if="verifiedProofs[proof.deviceKey]"
                        color="success-500"
                        name="check"
                      ></j-icon>
                      <j-icon size="xs" color="danger-500" name="cross" v-else> </j-icon>
                      {{ verifiedProofs[proof.deviceKey] ? "Verified" : "Not verified" }}
                    </j-badge>
                    <j-box pt="200">
                      <j-text nomargin color="black">
                        {{ shortETH(proof.deviceKey) }}
                      </j-text>
                    </j-box>
                    <j-button v-if="sameAgent" variant="link" @click="() => removeProof(proof)">
                      Remove wallet
                    </j-button>
                  </div>
                  <a v-if="sameAgent" class="wallet" href="https://dapp.ad4m.dev/" target="_blank">
                    <j-text size="600" nomargin>
                      <j-icon name="plus"></j-icon>
                      Add
                    </j-text>
                  </a>
                </div>
              </j-box>
              <j-box pt="500">
                <Attestations :address="selectedAddress" />
              </j-box>
            </div>
          </j-box>
        </div>
      </div>
    </div>

    <div class="sidebar" @click="() => uiStore.setAppSidebarOpen(!uiStore.showAppSidebar)">
      <j-icon name="layout-sidebar" size="md" />
    </div>
  </div>

  <j-modal
    v-if="showAddlinkModal"
    size="sm"
    :open="showAddlinkModal"
    @toggle="(e: any) => setAddLinkModal(e.target.open)"
  >
    <WebLinkAdd @cancel="() => setAddLinkModal(false)" @submit="() => setAddLinkModal(false)" />
  </j-modal>

  <j-modal
    v-if="showJoinCommunityModal"
    size="lg"
    :open="showJoinCommunityModal"
    @toggle="(e: any) => setShowJoinCommunityModal(e.target.open)"
  >
    <ProfileJoinLink
      @submit="() => setShowJoinCommunityModal(false)"
      @cancel="() => setShowJoinCommunityModal(false)"
      :joiningLink="joiningLink"
    />
  </j-modal>

  <j-modal
    v-if="modalsStore.showEditProfile"
    :open="modalsStore.showEditProfile"
    @toggle="(e: any) => (modalsStore.showEditProfile = e.target.open)"
  >
    <EditProfile
      @submit="() => (modalsStore.showEditProfile = false)"
      @cancel="() => (modalsStore.showEditProfile = false)"
    />
  </j-modal>

  <RouterView />
</template>

<script setup lang="ts">
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore, useModalStore, useThemeStore, useUiStore } from "@/stores";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { EntanglementProof, LinkExpression, Literal } from "@coasys/ad4m";
import { getAgentWebLinks } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { computed, onBeforeMount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Attestations from "./Attestations.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import WebLinkAdd from "./WebLinkAdd.vue";
import WebLinkCard from "./WebLinkCard.vue";
// @ts-ignore
import jazzicon from "@metamask/jazzicon";
import { storeToRefs } from "pinia";

defineOptions({ name: "ProfileView" });

const route = useRoute();
const router = useRouter();

const appStore = useAppStore();
const modalsStore = useModalStore();
const themeStore = useThemeStore();
const uiStore = useUiStore();

const { me } = storeToRefs(appStore);
const { ad4mClient } = appStore;

const profile = ref<Profile | null>(null);
const currentTab = ref("web3");
const showAddlinkModal = ref(false);
const showAddProofModal = ref(false);
const showEditlinkModal = ref(false);
const showJoinCommunityModal = ref(false);
const weblinks = ref<any[]>([]);
const joiningLink = ref("");
const editArea = ref(null);
const verifiedProofs = ref<Record<string, boolean>>({});
const selectedAddress = ref("");
const proofs = ref<EntanglementProof[]>([]);

const did = computed((): string => (route.params.did as string) || me.value?.did || "");
const sameAgent = computed(() => did.value === me.value?.did);
const hasHistory = computed(() => router?.options?.history?.state?.back);

function getIcon(address: string) {
  if (address) {
    const seed = parseInt(address.slice(2, 10), 16);
    const diameter = 40;
    const icon = jazzicon(diameter, seed);
    return icon.innerHTML;
  }
}

function shortETH(address: string) {
  if (!address || address.length !== 42 || !address.startsWith("0x")) {
    return "Invalid ETH Address";
  }
  return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
}

async function getEntanglementProofs() {
  const agent = await ad4mClient.agent.byDID(did.value);

  if (agent) {
    // Map to dedupe array
    const seen = new Set<string>();
    const proofLinks = agent.perspective?.links
      ? agent.perspective.links.filter((l) => l.data.predicate === "ad4m://entanglement_proof")
      : [];

    const expressions = await Promise.all(proofLinks?.map((link) => ad4mClient.expression.get(link.data.target)));

    const fetchedProofs = expressions.map((e) => JSON.parse(e.data)) as EntanglementProof[];

    const filteredProofs = fetchedProofs.filter((p: EntanglementProof) => {
      if (seen.has(p.deviceKey)) {
        return false;
      } else {
        seen.add(p.deviceKey);
        return true;
      }
    });

    for (const proof of filteredProofs) {
      const isVerified = await ad4mClient.runtime.verifyStringSignedByDid(
        agent.did,
        proof.did,
        proof.deviceKey,
        proof.deviceKeySignedByDid
      );
      verifiedProofs.value[proof.deviceKey] = isVerified;
    }

    proofs.value = filteredProofs;
    selectedAddress.value = filteredProofs.length > 0 ? filteredProofs[0].deviceKey : "";
  }
}

async function removeProof(proof: EntanglementProof) {
  const proofLink =
    me.value?.perspective?.links.filter((l: any) => {
      return (
        l.data.predicate === "ad4m://entanglement_proof" &&
        l.data.target.startsWith("literal://") &&
        Literal.fromUrl(l.data.target).get().data.deviceKey === proof.deviceKey
      );
    }) || [];

  if (proofLink.length > 0) {
    await ad4mClient.agent.mutatePublicPerspective({
      additions: [],
      removals: proofLink,
    });
  }
  getEntanglementProofs();
}

function setAddLinkModal(value: boolean): void {
  showAddlinkModal.value = value;
}

function setEditLinkModal(value: boolean, area: any): void {
  showEditlinkModal.value = value;
  editArea.value = area;
}

function setShowJoinCommunityModal(value: boolean): void {
  showJoinCommunityModal.value = value;
}

async function deleteWebLink(link: LinkExpression) {
  weblinks.value = weblinks.value.filter((l: any) => l.id !== link.id);
}

async function getAgentAreas() {
  const fetchedWebLinks = await getAgentWebLinks(did.value);
  weblinks.value = fetchedWebLinks;
}

onBeforeMount(() => themeStore.changeCurrentTheme("global"));

// Watchers
watch(showAddlinkModal, (val) => {
  if (!val) getAgentAreas();
});

watch(showAddProofModal, (val) => {
  if (!val) getEntanglementProofs();
});

watch(showEditlinkModal, (val) => {
  if (!val) getAgentAreas();
});

// Refresh profile cache and agent areas when edit modal closed
watch(
  () => modalsStore.showEditProfile,
  async (val) => {
    if (!val) {
      profile.value = await getCachedAgentProfile((route.params.did as string) || me.value.did, true);
      getAgentAreas();
    }
  }
);

watch(
  did,
  () => {
    getAgentAreas();
    getEntanglementProofs();
  },
  { immediate: true }
);

// Load profile when route changes
watch(
  () => route.params.did,
  async (newDid) => {
    const agentDid = Array.isArray(newDid) ? newDid[0] : newDid || me.value?.did;
    profile.value = await getCachedAgentProfile(agentDid);
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.profile {
  --avatar-size: clamp(var(--j-size-xxl), 10vw, 160px);
  width: 100%;
  max-width: 900px;
  margin: auto;
  padding-left: var(--j-space-500);
  padding-right: var(--j-space-500);
}

.avatar-wrapper {
  cursor: pointer;
  width: var(--avatar-size);
  height: var(--avatar-size);
  position: relative;

  .avatar {
    --j-avatar-size: var(--avatar-size);
    --j-skeleton-height: var(--avatar-size);
    --j-skeleton-width: var(--avatar-size);

    &::part(base) {
      border-radius: 20px;
      display: inline-block;
      border-radius: 30px;
      border: 7px solid var(--j-color-white);
    }

    &::part(img) {
      border-radius: 20px;
    }
  }

  .avatar-hover {
    display: flex;
    opacity: 0;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 7px;
    left: 7px;
    border-radius: 20px;
    width: calc(var(--avatar-size) - 14px);
    height: calc(var(--avatar-size) - 14px);
    background-color: rgba(0, 0, 0, 0.4);
    transition: opacity 0.2s ease-in-out;
  }

  &:hover {
    .avatar-hover {
      opacity: 1;
    }
  }
}

.profile__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--j-space-500);
}

.profile__container {
  width: 100%;
  height: calc(100% - env(safe-area-inset-top));
  overflow-y: auto;
  position: relative;
  padding-top: env(safe-area-inset-top);
}

.profile__content {
  max-width: 100%;
  overflow: hidden;
}

.profile__links {
  display: flex;
  flex-direction: column;
  gap: var(--j-space-500);
}
.profile__bg {
  height: clamp(150px, 200px, 250px);
  width: 100%;
  background-color: var(--j-color-ui-100);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.profile__avatar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 100%;
  margin-top: calc(var(--avatar-size) * -0.5);
}

.add {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--j-color-ui-100);
  border-radius: 4px;
  cursor: pointer;
  margin-right: 20px;
  margin-bottom: 20px;
}

.add:hover {
  background: var(--j-color-ui-50);
}

.back {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
}

.sidebar {
  position: absolute;
  top: calc(20px + env(safe-area-inset-top));
  left: 20px;
  cursor: pointer;
}

.tabs {
  border-bottom: 1px solid var(--j-color-ui-100);
}

.wallets {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: var(--j-space-500);
}

.wallet {
  text-decoration: none;
  color: currentColor;
  cursor: pointer;
  display: grid;
  place-content: center;
  text-align: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--j-border-radius-md);
  background-color: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-200);
}

.wallet:hover {
  background-color: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-400);
}

.wallet__avatar {
  border-radius: 50%;
  display: flex;
  overflow: hidden;
  margin: 0 auto;
  margin-bottom: var(--j-space-400);
}

.wallet.selected {
  border: 1px solid var(--j-color-primary-500);
  background-color: var(--j-color-ui-100);
}
</style>
