<template>
  <j-box v-if="profile" p="800">
    <j-flex a="center" direction="column" gap="500">
      <j-avatar
        style="--j-avatar-size: 100px"
        :hash="did"
        :src="profile.profilePicture"
      />
      <j-text variant="heading-sm"> {{ profile.username }}</j-text>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getProfile, parseProfile } from "@/utils/profileHelpers";
import { Profile } from "@/store/types";

export default defineComponent({
  props: ["did", "langAddress"],
  data() {
    return {
      profile: null as null | Profile,
    };
  },
  watch: {
    did: {
      handler: async function (did) {
        console.log("whaaat");
        let profileLang = this.langAddress;
        const dataExp = await getProfile(profileLang, did);

        if (dataExp) {
          const { data } = dataExp;
          this.profile = parseProfile(data.profile);
        }
      },
      immediate: true,
    },
  },
});
</script>
