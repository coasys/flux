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
  <j-box p="800" v-else>
    <j-flex a="center" direction="column" gap="500">
      <Skeleton variant="circle" width="100px" height="100px" />
      <Skeleton />
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getProfile } from "@/utils/profileHelpers";
import { Profile } from "@/store/types";
import Skeleton from "@/components/skeleton/Skeleton.vue";

export default defineComponent({
  components: { Skeleton },
  props: ["did", "langAddress"],
  data() {
    return {
      profile: null as null | Profile,
    };
  },
  watch: {
    did: async function (did) {
      // Reset profile while we get new data
      this.profile = null;
      let profileLang = this.langAddress;
      this.profile = await getProfile(profileLang, did);
    },
  },
});
</script>

<style></style>
