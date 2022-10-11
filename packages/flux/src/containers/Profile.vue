<template>
  <j-box v-if="profile" p="800">
    <j-flex a="center" direction="column" gap="500">
      <Avatar
        style="--j-avatar-size: 100px"
        :hash="did"
        :url="profile.thumbnailPicture"
      ></Avatar>

      <j-text
        v-if="profile.familyName || profile.givenName"
        variant="heading-sm"
        nomargin
      >
        {{ `${profile.givenName} ${profile.familyName}` }}
      </j-text>
      <j-text variant="body"> @{{ profile.username }}</j-text>
      <j-text v-if="profile.bio" variant="subheading">
        {{ profile.bio }}</j-text
      >
      <j-button variant="primary" @click="() => $emit('openCompleteProfile')">
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

<style></style>
