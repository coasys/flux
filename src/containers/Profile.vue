<template>
  <j-box v-if="profile" p="800">
    <j-flex a="center" direction="column" gap="500">
      <j-avatar
        style="--j-avatar-size: 100px"
        :hash="did"
        :src="
          profile['schema:image']
            ? JSON.parse(profile['schema:image'])['schema:contentUrl']
            : null
        "
      />
      <j-text variant="heading-sm"> {{ profile["foaf:AccountName"] }}</j-text>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getProfile } from "@/utils/profileHelpers";

export default defineComponent({
  props: ["did", "langAddress"],
  data() {
    return {
      profile: null,
    };
  },
  watch: {
    did: async function (did) {
      let profileLang = this.langAddress;
      const dataExp = await getProfile(profileLang, did);
      if (dataExp) {
        const { data } = dataExp;
        this.profile = data.profile;
      }
    },
  },
});
</script>
