<template>
  <div v-if="profile" class="profile__container">
    <div
      :style="{ backgroundImage: `url(${profileBg})` }"
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
          <div v-if="!sameAgent">
            <j-text>Links ({{ weblinks.length }})</j-text>
            <div class="grid">
              <ProfileCard
                v-for="link in weblinks"
                :key="link.id"
                :title="link.name"
                :description="link.description"
                :image="link.image"
                :sameAgent="sameAgent"
                @click="() => onLinkClick(link)"
                @delete="() => deleteLinks(link.id)"
                @edit="() => setEditLinkModal(true, link)"
              />
            </div>
          </div>

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

            <div class="grid" v-show="currentTab === 'communities'">
              <router-link
                class="grid-item"
                :to="{
                  name: 'community',
                  params: { communityId: community.state.perspectiveUuid },
                }"
                v-for="(community, key) in communities"
                :key="key"
              >
                <Avatar
                  size="xl"
                  style="--j-avatar-bg: var(--j-color-ui-500)"
                  :initials="
                    community.neighbourhood.name?.charAt(0).toUpperCase()
                  "
                  :url="community.neighbourhood.image"
                ></Avatar>
                <j-text color="black" size="500" weight="bold" nomargin>
                  {{ community.neighbourhood.name }}
                </j-text>
                <j-text nomargin size="400" color="ui-300">{{
                  community.neighbourhood.description
                }}</j-text>
              </router-link>
              <div
                class="grid-item"
                @click="() => setShowCreateCommunity(true)"
                v-if="sameAgent"
              >
                <j-icon name="plus" size="xl"></j-icon>
                <j-text>Add Community</j-text>
              </div>
            </div>
            <div class="grid" v-show="currentTab === 'weblinks'">
              <ProfileCard
                v-for="link in weblinks"
                :key="link.id"
                :title="link.name"
                :description="link.description"
                :image="link.image"
                :sameAgent="sameAgent"
                @click="() => onLinkClick(link)"
                @delete="() => deleteLinks(link.id)"
                @edit="() => setEditLinkModal(true, link)"
              />
              <div class="grid-item" @click="() => (showAddlinkModal = true)">
                <j-icon name="plus" size="xl"></j-icon>
                <j-text>Add Link</j-text>
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
    size="lg"
    :open="showAddlinkModal"
    @toggle="(e) => setAddLinkModal(e.target.open)"
  >
    <ProfileAddLink
      @submit="() => setAddLinkModal(false)"
      @cancel="() => setAddLinkModal(false)"
    ></ProfileAddLink>
  </j-modal>
  <j-modal
    v-if="showEditlinkModal"
    size="lg"
    :open="showEditlinkModal"
    @toggle="(e) => setEditLinkModal(e.target.open, editArea)"
  >
    <ProfileEditLink
      @submit="() => setEditLinkModal(false, editArea)"
      @cancel="() => setEditLinkModal(false, editArea)"
      :area="editArea"
    ></ProfileEditLink>
  </j-modal>
  <j-modal
    v-if="showJoinCommunityModal"
    size="lg"
    :open="showJoinCommunityModal"
    @toggle="(e) => setShowJoinCommunityModal(e.target.open)"
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
    @toggle="(e) => setShowEditProfile(e.target.open)"
  >
    <edit-profile
      @submit="() => setShowEditProfile(false)"
      @cancel="() => setShowEditProfile(false)"
      :bg="profileBg"
      :preBio="profile?.bio || ''"
    />
  </j-modal>
  <router-view></router-view>
</template>

<script lang="ts">
import { useDataStore } from "@/store/data";
import { ModalsState, ProfileWithDID } from "@/store/types";
import { Literal, PerspectiveInput } from "@perspect3vism/ad4m";
import { defineComponent } from "vue";
import ProfileCard from "./ProfileCards.vue";
import ProfileAddLink from "./ProfileAddLink.vue";
import ProfileEditLink from "./ProfileEditLink.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions } from "pinia";
import getAgentLinks from "utils/api/getAgentLinks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import Avatar from "@/components/avatar/Avatar.vue";
import {
  AREA_COMMUNITY,
  AREA_SIMPLE_AREA,
  AREA_WEBLINK,
  HAS_AREA,
} from "utils/constants/profile";
import getProfile, { getImage } from "utils/api/getProfile";

export default defineComponent({
  name: "ProfileView",
  components: {
    ProfileCard,
    ProfileAddLink,
    ProfileEditLink,
    ProfileJoinLink,
    EditProfile,
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
      profileBg: "",
      profile: null as ProfileWithDID | null,
      joiningLink: "",
      editArea: null as any,
    };
  },

  async created() {
    this.getProfile();
    this.getAgentAreas();
  },
  beforeCreate() {
    this.appStore.changeCurrentTheme("global");
  },
  methods: {
    async getProfile() {
      this.profile = await getProfile(this.did);
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
    async getAgentAreas() {
      const client = await getAd4mClient();
      const did = this.$route.params.did as string;

      const links = await getAgentLinks(did || (await client.agent.me()).did);
      const areaLinks = links.filter(
        (link) =>
          link.data.source.startsWith("area://") &&
          link.data.predicate === HAS_AREA
      );

      const weblinkMap = areaLinks.map((area: any) => {
        const literal = Literal.fromUrl(area.data.target).get();
        return literal.data;
      });

      this.weblinks = weblinkMap;
    },
    onLinkClick(link: any) {
      const dataStore = useDataStore();

      console.log("link click", link);

      if (link.type === AREA_COMMUNITY) {
        const community = dataStore.getCommunities.find(
          (e) => e.neighbourhood.neighbourhoodUrl === link.link
        );

        if (community) {
          this.$router.push({
            name: "community",
            params: { communityId: community?.neighbourhood.perspective.uuid },
          });
        } else {
          this.showJoinCommunityModal = true;
          this.joiningLink = link.has_post;
        }
      } else if (link.type === AREA_WEBLINK) {
        window.open(link.link, "_blank");
      } else if (link.type === AREA_SIMPLE_AREA) {
        this.$router.push({
          name: `profile-feed`,
          params: { fid: link.id },
        });
      }
    },
    async deleteLinks(areaName: string) {
      const client = await getAd4mClient();
      const userStore = useUserStore();
      const me = await client.agent.me();
      const userPerspective = userStore.getAgentProfileProxyPerspectiveId;
      const links = await getAgentLinks(me.did, userPerspective!);

      const newLinks = [];

      for (const link of links) {
        const newLink = JSON.parse(JSON.stringify(link));
        newLink.__typename = undefined;
        newLink.data.__typename = undefined;
        newLink.proof.__typename = undefined;

        if (link.data.source === areaName || link.data.target === areaName) {
          console.log(link);
          await client.perspective.removeLink(userPerspective!, newLink);
        } else {
          newLinks.push(newLink);
        }
      }

      this.weblinks = this.weblinks.filter((e) => e.id !== areaName);

      await client.agent.updatePublicPerspective({
        links: newLinks,
      } as PerspectiveInput);
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
    profile: {
      handler: async function (val) {
        if (val) {
          console.log("profilee", val);
          this.profileBg = await getImage(val.profileBg);
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
  max-width: 1300px;
  margin: auto;
  padding-left: var(--j-space-500);
  padding-right: var(--j-space-500);
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
.profile__bg {
  height: clamp(150px, 200px, 250px);
  width: 100%;
  background-color: var(--j-color-ui-100);
  background-repeat: no-repeat;
  background-size: cover;
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

.grid-item {
  width: 100%;
  border-radius: var(--j-border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--j-space-400);
  text-align: center;
  text-decoration: none;
  padding: var(--j-space-700);
  background-color: var(--j-color-ui-50);
}

.avatar {
  display: block;
  border-radius: 50%;
  height: 80px;
  width: 80px;
  --j-avatar-size: 100%;
  --j-avatar-border: none;
}

@media (min-width: 800px) {
  .avatar {
    height: 130px;
    width: 130px;
  }
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

.grid {
  display: grid;
  gap: var(--j-space-600);
  grid-template-columns: 1fr 1fr;
}

@media (min-width: 800px) {
  .grid {
    display: grid;
    gap: var(--j-space-400);
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.back {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
}
</style>
