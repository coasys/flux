<template>
  <j-box p="800">
    <j-flex gap="500" direction="column">
      <j-text nomargin variant="heading-sm">
        Members ({{ Object.keys(community.members).length ?? 0 }})
      </j-text>
      <j-input
        size="lg"
        placeholder="Search members..."
        type="search"
        :value="searchValue"
        @input="(e) => (searchValue = e.target.value)"
      >
        <j-icon name="search" size="sm" slot="start"></j-icon>
      </j-input>
      <j-flex direction="column" gap="400" v-if="!loading">
        <j-flex
          gap="500"
          style="cursor: pointer"
          v-for="communityMember in filteredCommunityMemberList"
          :key="communityMember.did"
          inline
          direction="row"
          j="center"
          a="center"
        >
          <Avatar
            size="xl"
            :hash="communityMember.did"
            :url="communityMember.thumbnailPicture"
            @click="() => profileClick(communityMember.did)"
          ></Avatar>
          <j-text color="black" nomargin variant="body">
            {{ communityMember.username }}
          </j-text>
        </j-flex>
      </j-flex>
      <j-flex direction="column" gap="400" v-else>
        <j-flex
          inline
          direction="row"
          j="center"
          a="center"
          gap="500"
          v-for="i in 4"
          :key="i"
        >
          <j-skeleton :key="i" variant="circle" width="xl" height="xl" />
          <j-skeleton
            :style="{
              '--j-skeleton-width': '60px',
              '--j-skeleton-height': '1em',
            }"
          />
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { NeighbourhoodState, ProfileWithDID } from "@/store/types";
import { useDataStore } from "@/store/data";

import getProfile from "utils/api/getProfile";
import Skeleton from "@/components/skeleton/Skeleton.vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import Avatar from "@/components/avatar/Avatar.vue";

export default defineComponent({
  emits: ["close", "submit"],
  components: { Skeleton, Avatar },
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      searchValue: "",
      memberList: [] as ProfileWithDID[],
      loading: false,
    };
  },
  watch: {
    "community.members": {
      handler: async function (users) {
        // reset before fetching again
        this.memberList = [];
        if (!users) return;
        this.loading = true;
        for (const user of users) {
          if (user) {
            const member = await getProfile(user);
            if (member) {
              this.memberList.push(member);
            }
          }
        }
        this.loading = false;
      },
      immediate: true,
    },
  },
  computed: {
    filteredCommunityMemberList() {
      return this.memberList.filter((member) => {
        return member.username.includes(this.searchValue);
      });
    },
    community(): NeighbourhoodState {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getNeighbourhood(id);
    },
  },
  methods: {
    async profileClick(did: string) {
      const client = await getAd4mClient();
      const me = await client.agent.me();

      this.$emit("close");

      if (did === me.did) {
        this.$router.push({ name: "home", params: { did } });
      } else {
        this.$router.push({
          name: "profile",
          params: { did, communityId: this.$route.params.communityId },
        });
      }
    },
  },
});
</script>
