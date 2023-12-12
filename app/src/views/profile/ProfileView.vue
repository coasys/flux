<template>
  <div v-if="profile" class="profile__container">
    <div
      :style="{ backgroundImage: `url(${profileBackground})` }"
      class="profile__bg"
    />

    <div class="profile">
      <div class="profile__layout">
        <div class="profile__info">
          <div class="profile__avatar">
            <Avatar
              class="avatar"
              :hash="did"
              :url="profile?.profilePicture"
            ></Avatar>
            <j-button
              v-if="sameAgent"
              variant="ghost"
              @click="() => setShowEditProfile(true)"
            >
              <j-icon size="sm" name="pen"></j-icon>
            </j-button>
          </div>
          <j-box pt="400" pb="300">
            <j-text
              nomargin
              v-if="profile.familyName || profile.givenName"
              variant="heading-sm"
            >
              {{ `${profile.givenName} ${profile.familyName}` }}
            </j-text>
            <j-text nomargin size="500" weight="500" color="ui-500">
              @{{ profile.username }}
            </j-text>
          </j-box>
          <j-box pt="400">
            <j-text nomargin size="500" color="ui-800" v-if="profile.bio">
              {{ profile.bio || "No bio yet" }}
            </j-text>
          </j-box>
        </div>

        <div class="profile__content">
          <j-box my="500">
            <j-tabs
              class="tabs"
              @change="(e: any) => (currentTab = e.target.value)"
              :value="currentTab"
            >
              <j-tab-item value="web2">Web2</j-tab-item>
              <j-tab-item value="web3">Web3</j-tab-item>
            </j-tabs>

            <div v-show="currentTab === 'web2'">
              <j-box py="500" align="right">
                <j-button
                  v-if="sameAgent"
                  variant="primary"
                  @click="() => (showAddlinkModal = true)"
                >
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
                    <div
                      class="wallet__avatar"
                      v-html="getIcon(proof.deviceKey)"
                    ></div>
                    <j-badge size="sm" variant="primary">
                      <j-icon
                        size="xs"
                        v-if="verifiedProofs[proof.deviceKey]"
                        color="success-500"
                        name="check"
                      ></j-icon>
                      <j-icon size="xs" color="danger-500" name="cross" v-else>
                      </j-icon>
                      {{
                        verifiedProofs[proof.deviceKey]
                          ? "Verified"
                          : "Not verified"
                      }}
                    </j-badge>
                    <j-box pt="200">
                      <j-text nomargin color="black">
                        {{ shortETH(proof.deviceKey) }}
                      </j-text>
                    </j-box>
                    <j-button
                      v-if="sameAgent"
                      variant="link"
                      @click="() => removeProof(proof)"
                    >
                      Remove wallet
                    </j-button>
                  </div>
                  <a
                    v-if="sameAgent"
                    class="wallet"
                    href="https://web3-adam.netlify.app/"
                    target="_blank"
                  >
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

    <div v-if="hasHistory" class="back" @click="() => $router.back()">
      <j-icon name="arrow-left" size="lg"></j-icon>
    </div>
  </div>
  <j-modal
    v-if="showAddlinkModal"
    size="sm"
    :open="showAddlinkModal"
    @toggle="(e: any) => setAddLinkModal(e.target.open)"
  >
    <WebLinkAdd
      @cancel="() => setAddLinkModal(false)"
      @submit="() => setAddLinkModal(false)"
    />
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
    ></ProfileJoinLink>
  </j-modal>
  <j-modal
    v-if="modals.showEditProfile"
    :open="modals.showEditProfile"
    @toggle="(e: any) => setShowEditProfile(e.target.open)"
  >
    <edit-profile
      @submit="() => setShowEditProfile(false)"
      @cancel="() => setShowEditProfile(false)"
    />
  </j-modal>
  <router-view></router-view>
</template>

<script lang="ts">
import { Profile } from "@coasys/flux-types";
import { ModalsState } from "@/store/types";
import {
  Ad4mClient,
  EntanglementProof,
  LinkExpression,
  Literal,
} from "@coasys/ad4m";
import { defineComponent, ref } from "vue";
import WebLinkCard from "./WebLinkCard.vue";
import CommunityCard from "./CommunityCard.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore } from "@/store/app";
import { mapActions } from "pinia";
import Avatar from "@/components/avatar/Avatar.vue";
import { getImage } from "@coasys/flux-utils";
import WebLinkAdd from "./WebLinkAdd.vue";
import { getAgentWebLinks } from "@coasys/flux-api";
import {
  usePerspectives,
  useCommunities,
  useAgent,
  useMe,
} from "@coasys/flux-vue";
// @ts-ignore
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { useRoute } from "vue-router";
import Attestations from "./Attestations.vue";
// @ts-ignore
import jazzicon from "@metamask/jazzicon";

export default defineComponent({
  name: "ProfileView",
  components: {
    CommunityCard,
    WebLinkCard,
    ProfileJoinLink,
    EditProfile,
    WebLinkAdd,
    Avatar,
    Attestations,
  },
  async setup() {
    const route = useRoute();

    const client: Ad4mClient = await getAd4mClient();
    const { neighbourhoods } = usePerspectives(client);
    const { communities } = useCommunities(neighbourhoods);

    const { me } = useMe(client.agent);

    const { profile } = useAgent(
      client.agent,
      () => route.params.did || me.value?.did
    );

    const appStore = useAppStore();

    return {
      client,
      verifiedProofs: ref<Record<string, boolean>>({}),
      selectedAddress: ref(""),
      proofs: ref<EntanglementProof[]>([]),
      me,
      profile,
      neighbourhoods,
      communities,
      appStore,
    };
  },
  data() {
    return {
      currentTab: "web3",
      showAddlinkModal: false,
      showAddProofModal: false,
      showEditlinkModal: false,
      showJoinCommunityModal: false,
      weblinks: [] as any,
      profileBackground: "",
      profile: null as Profile | null,
      joiningLink: "",
      editArea: null as any,
    };
  },
  beforeCreate() {
    this.appStore.changeCurrentTheme("global");
  },
  methods: {
    getIcon(address: string) {
      if (address) {
        const seed = parseInt(address.slice(2, 10), 16);
        const diameter = 40;
        const icon = jazzicon(diameter, seed);
        icon.innerHTML;
        return icon.innerHTML;
      }
    },
    shortETH(address: string) {
      if (!address || address.length !== 42 || !address.startsWith("0x")) {
        return "Invalid ETH Address";
      }
      return `${address.substring(0, 8)}...${address.substring(
        address.length - 4
      )}`;
    },
    async getEntanglementProofs() {
      const agent = await this.client.agent.byDID(this.did);

      if (agent) {
        // Map to dedupe array
        const seen = new Set<string>();
        const proofLinks = agent.perspective?.links
          ? agent.perspective.links.filter(
              (l) => l.data.predicate === "ad4m://entanglement_proof"
            )
          : [];

        const expressions = await Promise.all(
          proofLinks?.map((link) =>
            this.client.expression.get(link.data.target)
          )
        );

        const proofs = expressions.map((e) =>
          JSON.parse(e.data)
        ) as EntanglementProof[];

        const filteredProofs = proofs.filter((p: EntanglementProof) => {
          if (seen.has(p.deviceKey)) {
            return false;
          } else {
            seen.add(p.deviceKey);
            return true;
          }
        });

        filteredProofs.forEach(async (proof) => {
          const isVerified = await this.client.runtime.verifyStringSignedByDid(
            agent.did,
            proof.did,
            proof.deviceKey,
            proof.deviceKeySignedByDid
          );
          this.verifiedProofs[proof.deviceKey] = isVerified;
        });

        this.proofs = filteredProofs;
        this.selectedAddress =
          filteredProofs.length > 0 ? filteredProofs[0].deviceKey : "";
      }
    },
    async removeProof(proof: EntanglementProof) {
      const proofLink =
        this.me?.perspective?.links.filter((l) => {
          return (
            l.data.predicate === "ad4m://entanglement_proof" &&
            l.data.target.startsWith("literal://") &&
            Literal.fromUrl(l.data.target).get().data.deviceKey ===
              proof.deviceKey
          );
        }) || [];

      if (proofLink.length > 0) {
        await this.client.agent.mutatePublicPerspective({
          additions: [],
          removals: proofLink,
        });
      }
      this.getEntanglementProofs();
    },
    setAddLinkModal(value: boolean): void {
      this.showAddlinkModal = value;
    },
    setEditLinkModal(value: boolean, area: any): void {
      this.showEditlinkModal = value;
      this.editArea = area;
    },
    setShowJoinCommunityModal(value: boolean): void {
      this.showJoinCommunityModal = value;
    },
    async deleteWebLink(link: LinkExpression) {
      this.weblinks = this.weblinks.filter((l: any) => l.id !== link.id);
    },
    async getAgentAreas() {
      const webLinks = await getAgentWebLinks(this.did);
      this.weblinks = webLinks;
    },
    ...mapActions(useAppStore, [
      "setShowEditProfile",
      "setShowCreateCommunity",
    ]),
  },
  watch: {
    showAddlinkModal() {
      if (!this.showAddlinkModal) {
        this.getAgentAreas();
      }
    },
    showAddProofModal() {
      if (!this.showAddProofModal) {
        this.getEntanglementProofs();
      }
    },
    showEditlinkModal() {
      if (!this.showEditlinkModal) {
        this.getAgentAreas();
      }
    },
    "modals.showEditProfile"() {
      if (!this.modals.showEditProfile) {
        this.getAgentAreas();
      }
    },
    did: {
      handler: async function () {
        this.getAgentAreas();
        this.getEntanglementProofs();
      },
      immediate: true,
    },
    profile: {
      handler: async function (val) {
        if (val) {
          this.profileBackground = await getImage(val.profileBackground);
        }
      },
      immediate: true,
    },
  },
  computed: {
    hasHistory() {
      return this.$router.options.history.state.back;
    },
    did(): string {
      return (this.$route.params.did as string) || this.me?.did || "";
    },
    sameAgent() {
      return this.did === this.me?.did;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
});
</script>

<style lang="css" scoped>
.profile {
  --avatar-size: clamp(var(--j-size-xxl), 10vw, 160px);
  width: 100%;
  max-width: 900px;
  margin: auto;
  padding-left: var(--j-space-500);
  padding-right: var(--j-space-500);
}

.avatar {
  --j-avatar-size: var(--avatar-size);
  --j-skeleton-height: var(--avatar-size);
  --j-skeleton-width: var(--avatar-size);
}

.avatar::part(base) {
  border-radius: 20px;
  display: inline-block;
  border-radius: 30px;
  border: 7px solid var(--j-color-white);
}

.avatar::part(img) {
  border-radius: 20px;
}

.profile__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--j-space-500);
}

.profile__container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
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
