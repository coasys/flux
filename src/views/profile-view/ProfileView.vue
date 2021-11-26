<template>
  <div class="profile__container">
    <div
      :style="{ backgroundImage: `url(${profilebg})` }"
      class="profile__bg"
    />
    <div v-if="profile" class="profile">
      <j-flex a="start" direction="column" gap="500">
        <div class="profile__avatar">
          <j-avatar
            style="--j-avatar-size: 100px"
            :hash="$route.params.did"
            :src="profile.profilePicture"
          />
          <j-button @click="() => setShowEditProfile(true)">Edit Profile</j-button>
        </div>
        <j-text
          v-if="profile.familyName || profile.givenName"
          variant="heading-sm"
        >
          {{ `${profile.familyName} ${profile.givenName}` }}</j-text
        >
        <j-text variant="heading-sm">@{{ profile.username }}</j-text>
        <j-text variant="subheading"> {{ bio }}</j-text>
      </j-flex>
      <div class="grid">
        <ProfileCard
          v-for="link in profileLinks"
          :key="link.id"
          :title="link.has_name"
          :description="link.has_description"
          :image="link.has_image"
          @click="() => onLinkClick(link)"
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
  <j-modal
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
    :open="modals.showEditProfile"
    @toggle="(e) => setShowEditProfile(e.target.open)"
  >
    <edit-profile
      @submit="() => setShowEditProfile(false)"
      @cancel="() => setShowEditProfile(false)"
      :bg="profilebg"
      :preBio="bio"
    />
  </j-modal>
  <router-view></router-view>
</template>

<script lang="ts">
import { ad4mClient } from "@/app";
import { useDataStore } from "@/store/data";
import { ExpressionTypes, ModalsState, Profile } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { Link, LinkExpression } from "@perspect3vism/ad4m";
import { defineComponent } from "vue";
import ProfileCard from "./ProfileCards.vue";
import ProfileAddLink from "./ProfileAddLink.vue";
import ProfileJoinLink from "./ProfileJoinLink.vue";
import { useUserStore } from "@/store/user";
import EditProfile from "@/containers/EditProfile.vue";
import { useAppStore } from "@/store/app";
import { mapActions } from "pinia";
import getAgentLinks from "@/utils/getAgentLinks";

export default defineComponent({
  name: "ProfileView",
  components: {
    ProfileCard,
    ProfileAddLink,
    ProfileJoinLink,
    EditProfile
  },
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
    };
  },
  data() {
    return {
      profile: null as null | Profile,
      bio: "",
      showAddlinkModal: false,
      showJoinCommunityModal: false,
      profileLinks: [] as any[],
      profilebg: "",
      joiningLink: "",
      sameAgent: false,
    };
  },
  methods: {
    setAddLinkModal(value: boolean): void {
      this.showAddlinkModal = value;
    },
    setShowJoinCommunityModal(value: boolean): void {
      this.showJoinCommunityModal = value;
    },
    async getAgentProfile() {
      const did = this.$route.params.did as string;
      const me = await ad4mClient.agent.me();
      const userStore = useUserStore();
      const userPerspective = userStore.getFluxPerspectiveId;

      if (did === undefined || did === me.did) {
        this.profile = userStore.getProfile!;
      } else {
        const profileLang = Object.values(
          useDataStore().neighbourhoods
        )[0].typedExpressionLanguages.find(
          (t) => t.expressionType === ExpressionTypes.ProfileExpression
        )?.languageAddress;

        const dataExp = await getProfile(profileLang!, did);

        if (dataExp) {
          this.profile = dataExp;
        }
      }

      const links = await getAgentLinks(did || me.did, userPerspective!);

      const preArea: { [x: string]: any } = {};

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
        } else if (predicate === "has_image") {
          const expUrl = e.data.target.replace("image://", "");
          const image = await ad4mClient.expression.get(expUrl);

          if (image) {
            console.log('image', image)
            preArea[e.data.source][predicate] = image.data.slice(1, -1);

            if (e.data.source === "flux://profile") {
              this.profilebg = image.data.slice(1, -1);
            }
          }

        } else {
          preArea[e.data.source][predicate] = e.data.target.split("://")[1];
        }
      }

      this.profileLinks = Object.values(preArea).filter(
        (e) => e.id !== "flux://profile"
      );

      const bioLink = links.find(
        (e: any) => e.data.predicate === "sioc://has_bio"
      ) as LinkExpression;

      if (bioLink) {
        this.bio = bioLink.data.target.split("://")[1];
      }
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
        window.api.send("openLinkInBrowser", link.has_post);
      }
    },
    ...mapActions(useAppStore, [
      "setShowEditProfile",
    ]),
  },
  async mounted() {
    this.getAgentProfile();
    const did = this.$route.params.did as string;
    const me = await ad4mClient.agent.me();

    this.sameAgent = did === me.did;
    if (did === undefined) {
      this.sameAgent = true;  
    }

  },
  watch: {
    showAddlinkModal() {
      if (!this.showAddlinkModal) {
        this.getAgentProfile();
      }
    },
    "modals.showEditProfile"() {
      if (!this.modals.showEditProfile) {
        this.getAgentProfile();
      }
    }
  },
  computed: {
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
});
</script>

<style lang="css" scoped>
.profile__container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}
.profile__bg {
  height: clamp(150px, 200px, 250px);
  width: 100%;
  background-color: grey;
  background-repeat: no-repeat;
  background-size: cover;
}

.profile__avatar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 100%;
  margin-top: -40px;
}

.add {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid grey;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 20px;
  margin-bottom: 20px;
}

.grid {
  display: flex;
  flex-wrap: wrap;
}

.profile {
    width: 100%;
  max-width: 1000px;
  margin: auto;
}
</style>
