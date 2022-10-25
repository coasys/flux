<template>
  <j-box class="profile" v-if="profile" p="800">
    <j-box pb="500">
      <Avatar
        style="--j-avatar-size: 100px"
        :hash="did"
        :url="profile.thumbnailPicture"
      ></Avatar>
    </j-box>

    <j-text
      v-if="profile.familyName || profile.givenName"
      size="600"
      color="black"
      weight="800"
      nomargin
    >
      {{ `${profile.givenName} ${profile.familyName}` }}
    </j-text>
    <j-text color="ui-500"> @{{ profile.username }}</j-text>
    <j-text v-if="profile.bio" size="400"> {{ profile.bio }}</j-text>
    <j-button variant="link" @click="() => $emit('openCompleteProfile')">
      View full profile
    </j-button>
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
import { Profile } from "@/store/types";
import Skeleton from "@/components/skeleton/Skeleton.vue";
import getProfile from "utils/api/getProfile";
import Avatar from "@/components/avatar/Avatar.vue";

export default defineComponent({
  components: { Skeleton, Avatar },
  props: ["did", "langAddress"],
  emits: ["openCompleteProfile"],
  data() {
    return {
      profile: null as null | Profile,
    };
  },
  watch: {
    did: {
      handler: async function (did) {
        // reset profile before fetching again
        this.profile = null;
        if (did) {
          console.log("did", did);
          this.profile = await getProfile(did);
        }
      },
      immediate: true,
    },
  },
});
</script>

<style scoped>
.profile {
  text-align: center;
}
</style>
