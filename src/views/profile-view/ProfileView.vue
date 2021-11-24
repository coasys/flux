<template>
  <div class="profile__container">
    <div class="profile__bg"></div>
    <j-box v-if="profile" p="800">
      <j-flex a="start" direction="column" gap="500">
        <div class="profile__avatar">
          <j-avatar
            style="--j-avatar-size: 100px"
            :hash="$route.params.did"
            :src="profile.profilePicture"
          />
          <j-button>Send message</j-button>
        </div>
        <j-text v-if="profile.familyName || profile.givenName" variant="heading-sm"> {{ `${profile.familyName} ${profile.givenName}` }}</j-text>
        <j-text variant="heading-sm"> {{ profile.username }}</j-text>
        <j-text variant="subheading"> {{ bio }}</j-text>
      </j-flex>
      <div class="grid">
        <ProfileCard title="My feed" description="A small description of this thing" />
        <ProfileCard title="Blog" description="A small description of this thing" />
        <ProfileCard title="Events" description="A small description of this thing" />
        <ProfileCard title="My Private" description="A small description of this thing" />
        <div class="add" @click="() => (showAddlinkModal = true)">
          <j-icon name="plus" size="xl"></j-icon>
          <j-text>Add Link</j-text>
        </div>
      </div>
    </j-box>
  </div>
  <j-modal
    size="xl"
    :open="showAddlinkModal"
    @toggle="(e) => toggleAddLinkModal(e)"
  >
    <ProfileAddLink></ProfileAddLink>
  </j-modal>
  <router-view></router-view>
</template>

<script lang="ts">
import { ad4mClient } from "@/app";
import { useDataStore } from "@/store/data";
import { ExpressionTypes, Profile } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { LinkExpression } from "@perspect3vism/ad4m";
import { defineComponent } from "vue";
import ProfileCard from './ProfileCards.vue'
import ProfileAddLink from './ProfileAddLink.vue'
import { useUserStore } from "@/store/user";

export default defineComponent({
  name: "ProfileView",
  components: {
    ProfileCard,
    ProfileAddLink
  },
  data() {
    return {
      profile: null as null | Profile,
      bio: "",
      showAddlinkModal: false
    }
  },
  methods: {
    toggleAddLinkModal(e: any): void {
      this.showAddlinkModal = e.target.open;
    },
  },
  async mounted() {
    const did = this.$route.params.did as string;
    const userStore = useUserStore();
    const userPerspective = userStore.getFluxPerspectiveId;
    
    const profileLang = Object.values(useDataStore().neighbourhoods)[0]
      .typedExpressionLanguages.find((t) => t.expressionType === ExpressionTypes.ProfileExpression)?.languageAddress;
    
    const dataExp = await getProfile(profileLang!, did);
    
    if (dataExp) {
      this.profile = dataExp;
    }


    // @ts-ignore
    const { links } = await ad4mClient.perspective.snapshotByUUID(
      userPerspective!
    );

    console.log('profilePerspective', links)

    const preArea: {[x: string]: any} = {};

    links.forEach((e: any) => {
      const predicate = e.data.predicate.split('://')[1];
      console.log(e.data, predicate)
        if (!preArea[e.data.source]) {
          preArea[e.data.source] = {
            [predicate]: predicate === 'has_post' ? e.data.target : e.data.target.split('://')[1],
          }
        }

        preArea[e.data.source][predicate] = predicate === 'has_post' ? e.data.target : e.data.target.split('://')[1];
    });

    console.log('preArea', preArea)
    
    const bioLink = links.find((e: any) => e.data.predicate === 'sioc://has_bio') as LinkExpression;
    
    this.bio = bioLink.data.target.split('://')[1];
  }
});
</script>

<style lang="css" scoped>
.profile__container {
  width: 100%;
  max-width: 1000px;
  margin: auto;
}
.profile__bg {
  height: clamp(200px, 10vh, 300px);
  width: 100%;
  background-color: grey;
}

.profile__avatar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  width: 100%;
  margin-top: -90px;
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
</style>