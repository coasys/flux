<template>
  <j-box class="profile" v-if="profile" p="800">
    <j-box pb="500">
      <Avatar
        size="xxl"
        :hash="did"
        :url="profile.profileThumbnailPicture"
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
    <j-box>
      <j-button size="sm" variant="primary" v-if="!sameAgent">
        <j-icon
          slot="start"
          size="sm"
          :name="isFriend ? 'person-dash-fill' : 'person-plus-fill'"
        ></j-icon>
        {{ isFriend ? "Remove friend" : "Hello" }}
      </j-button>
    </j-box>
    <j-button full variant="link" @click="() => $emit('openCompleteProfile')">
      View full profile
    </j-button>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";
import Avatar from "@/components/avatar/Avatar.vue";
import { useUserStore } from "@/store/user";

export default defineComponent({
  components: { Avatar },
  props: ["did", "langAddress"],
  emits: ["openCompleteProfile"],
  setup() {
    return {
      userStore: useUserStore(),
    };
  },
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
          this.profile = await getProfile(did);
        }
      },
      immediate: true,
    },
  },
  computed: {
    sameAgent() {
      return this.userStore.agent.did === this.did;
    },
    isFriend() {
      return this.userStore.friends.includes(this.did);
    },
  },
});
</script>

<style scoped>
.profile {
  text-align: center;
}
</style>
