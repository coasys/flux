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
          <j-box my="500" v-if="!sameAgent">
            <j-text>Links ({{ weblinks.length }})</j-text>
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
          </j-box>

          <j-box my="500" v-if="sameAgent">
            <j-tabs
              @change="(e: any) => (currentTab = e.target.value)"
              :value="currentTab"
            >
              <j-tab-item value="communities">
                Communities ({{ communities.length }})
              </j-tab-item>
              <j-tab-item value="weblinks">
                Weblinks ({{ weblinks.length }})
              </j-tab-item>
            </j-tabs>

            <div v-show="currentTab === 'communities'">
              <j-box py="500" align="right">
                <j-button
                  variant="subtle"
                  @click="() => setShowCreateCommunity(true)"
                  v-if="sameAgent"
                >
                  <j-icon slot="start" name="plus" size="sm"></j-icon>
                  Add Community
                </j-button>
              </j-box>
              <div class="profile__links">
                <CommunityCard
                  v-for="(community, key) in communities"
                  :key="key"
                  :name="community.neighbourhood.name"
                  :description="community.neighbourhood.description"
                  :url="community.neighbourhood.image"
                  :uuid="community.neighbourhood.uuid"
                ></CommunityCard>
              </div>
            </div>
            <div v-show="currentTab === 'weblinks'">
              <j-box py="500" align="right">
                <j-button
                  variant="subtle"
                  @click="() => (showAddlinkModal = true)"
                >
                  <j-icon slot="start" name="plus" size="sm"></j-icon>
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
import { useDataStore } from "@/store/data";
import { Profile } from "utils/types";
import { ModalsState } from "@/store/types";
import { LinkExpression, Literal } from "@perspect3vism/ad4m";
import { defineComponent } from "vue";
import WebLinkCard from "./WebLinkCard.vue";
import CommunityCard from "./CommunityCard.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions } from "pinia";
import Avatar from "@/components/avatar/Avatar.vue";
import { getProfile } from "utils/api";
import { getImage } from "utils/helpers";
import WebLinkAdd from "./WebLinkAdd.vue";
import { getAgentWebLinks } from "utils/api";

export default defineComponent({
  name: "ProfileView",
  components: {
    CommunityCard,
    WebLinkCard,
    ProfileJoinLink,
    EditProfile,
    WebLinkAdd,
    Avatar,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const userStore = useUserStore();
    return {
      appStore,
      dataStore,
      userStore,
    };
  },
  data() {
    return {
      currentTab: "communities",
      showAddlinkModal: false,
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
    async getProfile() {
      if (this.sameAgent) {
        this.profile = this.userStore.profile;
      } else {
        this.profile = await getProfile(this.did);
      }
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
        this.getProfile();
      }
    },
    showEditlinkModal() {
      if (!this.showEditlinkModal) {
        this.getAgentAreas();
        this.getProfile();
      }
    },
    "modals.showEditProfile"() {
      if (!this.modals.showEditProfile) {
        this.getAgentAreas();
        this.getProfile();
      }
    },
    did: {
      handler: async function () {
        this.getProfile();
        this.getAgentAreas();
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
      return (
        (this.$route.params.did as string) || this.userStore.agent.did || ""
      );
    },
    sameAgent() {
      return this.did === this.userStore.agent.did;
    },
    communities() {
      return this.dataStore.getCommunities;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
});
</script>

<style lang="css" scoped>
.profile {
  width: 100%;
  max-width: 1200px;
  margin: auto;
  padding-left: var(--j-space-500);
  padding-right: var(--j-space-500);
}

.avatar {
  --j-avatar-size: 100px;
  --j-skeleton-height: 100px;
  --j-skeleton-width: 100px;
}

.profile__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--j-space-500);
}

@media (min-width: 800px) {
  .profile__layout {
    display: grid;
    grid-template-columns: 2fr 5fr;
    gap: var(--j-space-900);
  }
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
  margin-top: -60px;
}

.profile__info {
  padding: var(--j-space-500);
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
</style>
