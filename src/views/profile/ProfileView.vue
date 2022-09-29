<template>
  <div class="profile__container">
    <div
      :style="{ backgroundImage: `url(${profilebg})` }"
      class="profile__bg"
    />

    <div v-if="profile" class="profile">
      <div class="profile__layout">
        <div class="profile__info">
          <div class="profile__avatar">
            <Avatar
              class="avatar"
              :hash="userStore.agent.did"
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
          <j-box py="500">
            <j-tabs
              @change="(e: any) => (currentTab = e.target.value)"
              :value="currentTab"
            >
              <j-tab-item value="communities"
                >Communities ({{ communities.length }})</j-tab-item
              >
              <j-tab-item value="weblinks"
                >Weblinks ({{ profileLinks.length }})</j-tab-item
              >
            </j-tabs>
          </j-box>
          <div class="grid" v-if="currentTab === 'communities'">
            <router-link
              class="community-item"
              :to="{
                name: 'community',
                params: { communityId: community.state.perspectiveUuid },
              }"
              v-for="(community, key) in communities"
              :key="key"
            >
              <j-avatar
                size="xl"
                :did="community.state.perspectiveUuid"
              ></j-avatar>
              <j-text color="black" nomargin>
                {{ community.neighbourhood.name }}
              </j-text>
            </router-link>
            <div
              class="add"
              @click="() => setShowCreateCommunity(true)"
              v-if="sameAgent"
            >
              <j-icon name="plus" size="xl"></j-icon>
              <j-text>Add Community</j-text>
            </div>
          </div>
          <div class="grid" v-if="currentTab === 'weblinks'">
            <ProfileCard
              v-for="link in profileLinks"
              :key="link.id"
              :title="link.has_name"
              :description="link.has_description"
              :image="link.has_image"
              :sameAgent="sameAgent"
              @click="() => onLinkClick(link)"
              @delete="() => deleteLinks(link.id)"
              @edit="() => setEditLinkModal(true, link)"
            />
            <div
              class="add"
              @click="() => (showAddlinkModal = true)"
              v-if="sameAgent"
            >
              <j-icon name="plus" size="xl"></j-icon>
              <j-text>Add Link</j-text>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="back"
      @click="() => $router.back()"
      v-if="$route.name !== 'home'"
    >
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
      :bg="profilebg"
      :preBio="profile?.bio || ''"
    />
  </j-modal>
  <router-view></router-view>
</template>

<script lang="ts">
import { useDataStore } from "@/store/data";
import { ModalsState, ProfileWithDID } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { PerspectiveInput } from "@perspect3vism/ad4m";
import { defineComponent } from "vue";
import ProfileCard from "./ProfileCards.vue";
import ProfileAddLink from "./ProfileAddLink.vue";
import ProfileEditLink from "./ProfileEditLink.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { mapActions } from "pinia";
import getAgentLinks from "@/utils/getAgentLinks";
import { FLUX_PROFILE } from "@/constants/profile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import Avatar from "@/components/avatar/Avatar.vue";

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
      profileLinks: [] as any[],
      profilebg: "",
      joiningLink: "",
      sameAgent: false,
      editArea: null as any,
    };
  },
  beforeCreate() {
    this.appStore.changeCurrentTheme("global");
  },
  methods: {
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
      const me = await client.agent.me();
      const userStore = useUserStore();
      const userPerspective = userStore.getAgentProfileProxyPerspectiveId;

      const links = (
        await getAgentLinks(
          did || me.did,
          did === me.did || did === undefined ? userPerspective! : undefined
        )
      ).filter(
        (e) =>
          //Filter out the flux and ad4m profile links
          !e.data.source.startsWith("flux://") &&
          !e.data.source.startsWith(did || me.did)
      );
      console.log(links);

      const preArea: { [x: string]: { [x: string]: any } } = {};

      for (const e of links) {
        const predicate = e.data.predicate.split("://")[1];
        if (!preArea[e.data.source]) {
          preArea[e.data.source] = {
            id: e.data.source,
          };
        }

        if (predicate === "has_post") {
          preArea[e.data.source][predicate] = e.data.target.replace(
            "text://",
            ""
          );
        } else if (predicate === "has_images" || predicate === "has_image") {
          try {
            const expUrl = e.data.target;
            const image = await client.expression.get(expUrl);
            if (image) {
              if (!preArea[e.data.source][predicate]) {
                preArea[e.data.source][predicate] = [];
                preArea[e.data.source]["has_image"] = image.data.slice(1, -1);
              }

              if (predicate === "has_images") {
                preArea[e.data.source][predicate].push(image.data.slice(1, -1));
              } else {
                preArea[e.data.source][predicate] = image.data.slice(1, -1);
              }
            }
          } catch (e) {
            console.log("Error encountered while parsing images", e);
          }
        } else {
          preArea[e.data.source][predicate] = e.data.target.split("://")[1];
        }
      }

      console.log(preArea);

      this.profileLinks = Object.values(preArea).filter(
        (e) => e.id !== FLUX_PROFILE
      );
    },
    onLinkClick(link: any) {
      const dataStore = useDataStore();

      if (link.area_type === "community") {
        const community = dataStore.getCommunities.find(
          (e) => e.neighbourhood.neighbourhoodUrl === link.has_post
        );
        console.log(
          community,
          this.showJoinCommunityModal,
          this.showAddlinkModal
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
      } else if (link.area_type === "webLink") {
        window.open(link.has_post, "_blank");
      } else if (link.area_type === "simpleArea") {
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

      this.profileLinks = this.profileLinks.filter((e) => e.id !== areaName);

      await client.agent.updatePublicPerspective({
        links: newLinks,
      } as PerspectiveInput);
    },
    ...mapActions(useAppStore, [
      "setShowEditProfile",
      "setShowCreateCommunity",
    ]),
  },
  async created() {
    const client = await getAd4mClient();

    this.getAgentAreas();
    const did = this.$route.params.did as string;
    const me = await client.agent.me();

    this.sameAgent = did === me.did;
    if (did === undefined || did.length === 0) {
      this.sameAgent = true;
    }
  },
  watch: {
    showAddlinkModal() {
      if (!this.showAddlinkModal) {
        this.getAgentAreas();
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
  },
  computed: {
    profile() {
      return this.userStore.profile;
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

.community-item {
  width: 100%;
  border-radius: var(--j-border-radius);
  display: grid;
  gap: var(--j-space-400);
  place-content: center;
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
