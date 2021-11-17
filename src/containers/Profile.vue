<template>
  <j-box v-if="profile" p="800">
    <j-flex a="center" direction="column" gap="500">
      <j-avatar
        style="--j-avatar-size: 100px"
        :hash="did"
        :src="profile.profilePicture"
      />
      <j-text v-if="profile.familyName || profile.givenName" variant="heading-sm"> {{ `${profile.familyName} ${profile.givenName}` }}</j-text>
      <j-text variant="heading-sm"> {{ profile.username }}</j-text>
      <j-text variant="subheading"> {{ bio }}</j-text>
      <j-text variant="heading-sm">
        {{ agentPerspective?.links.map((link) => link.data.target) }}</j-text
      >
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getProfile, parseProfile } from "@/utils/profileHelpers";
import { Profile } from "@/store/types";
import { LinkExpression, Perspective } from "@perspect3vism/ad4m";
import { ad4mClient } from "@/app";

export default defineComponent({
  props: ["did", "langAddress"],
  data() {
    return {
      profile: null as null | Profile,
      agentPerspective: undefined as undefined | Perspective | null,
      bio: ""
    };
  },
  watch: {
    did: {
      handler: async function (did) {
        let profileLang = this.langAddress;
        const dataExp = await getProfile(profileLang, did);
        if (dataExp) {
          this.profile = dataExp;
        }

        const profilePerspective = await ad4mClient.agent.byDID(did);
        this.agentPerspective = profilePerspective.perspective;
        
        const bioLink = profilePerspective.perspective?.links.find(e => e.data.predicate === 'sioc://has_bio') as LinkExpression;
        this.bio = bioLink.data.target.split('://')[1];
      },
      immediate: true,
    }
  },
});
</script>
