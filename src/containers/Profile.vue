<template>
  <j-box v-if="profile" p="800">
    <j-flex a="center" direction="column" gap="500">
      <j-avatar
        style="--j-avatar-size: 100px"
        :hash="did"
        :src="profile.profilePicture"
      />
      <j-text
        v-if="profile.familyName || profile.givenName"
        variant="heading-sm"
        nomargin
      >
        {{ `${profile.givenName} ${profile.familyName}` }}
      </j-text>
      <j-text variant="body"> @{{ profile.username }}</j-text>
      <j-text v-if="bio" variant="subheading"> {{ bio }}</j-text>
      <j-button @click="() => $emit('openCompleteProfile')">
        View complete profile
      </j-button>
    </j-flex>
  </j-box>
  <j-box p="800" v-else>
    <j-flex a="center" direction="column" gap="500">
      <Skeleton variant="circle" width="100px" height="100px" />
      <Skeleton />
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getProfile, parseProfile } from "@/utils/profileHelpers";
import { Profile } from "@/store/types";
import Skeleton from "@/components/skeleton/Skeleton.vue";
import { LinkExpression, Perspective } from "@perspect3vism/ad4m";
import { ad4mClient } from "@/app";

export default defineComponent({
  components: { Skeleton },
  props: ["did", "langAddress"],
  emits: ["openCompleteProfile"],
  data() {
    return {
      profile: null as null | Profile,
      agentPerspective: undefined as undefined | Perspective | null,
      bio: "",
    };
  },
  watch: {
    did: {
      handler: async function (did) {
        // reset profile before fetching again
        this.profile = null;
        let profileLang = this.langAddress;
        const dataExp = await getProfile(profileLang, did);
        if (dataExp) {
          this.profile = dataExp;
        }

        const profilePerspective = await ad4mClient.agent.byDID(did);
        this.agentPerspective = profilePerspective.perspective;

        const bioLink = profilePerspective.perspective?.links.find(
          (e) => e.data.predicate === "sioc://has_bio"
        ) as LinkExpression;
        if (bioLink) {
          this.bio = bioLink.data.target.split("://")[1];
        }
      },
      immediate: true,
    },
  },
});
</script>

<style></style>
