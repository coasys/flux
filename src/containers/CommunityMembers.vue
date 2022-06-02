<template>
  <j-box p="800">
    <j-flex gap="500" direction="column">
      <j-text variant="heading-sm">
        All group members ({{ Object.keys(community.members).length ?? 0 }})
      </j-text>
      <j-input
        size="lg"
        placeholder="Search members"
        type="search"
        :value="searchValue"
        @input="(e) => (searchValue = e.target.value)"
      >
        <j-icon name="search" size="sm" slot="end"></j-icon>
      </j-input>
      <j-flex wrap gap="600" v-if="!loading">
        <j-flex
          gap="300"
          style="cursor: pointer"
          v-for="communityMember in filteredCommunityMemberList"
          :key="communityMember.did"
          inline
          direction="column"
          a="center"
        >
          <j-avatar
            size="lg"
            :hash="communityMember.did"
            :src="communityMember.thumbnailPicture"
            @click="() => profileClick(communityMember.did)"
          />
          <j-text variant="body">
            {{ communityMember.username }}
          </j-text>
        </j-flex>
      </j-flex>
      <j-flex wrap gap="600" v-else>
        <j-flex
          inline
          direction="column"
          a="center"
          gap="300"
          v-for="i in 4"
          :key="i"
        >
          <Skeleton
            :key="i"
            variant="circle"
            width="var(--j-size-lg)"
            height="var(--j-size-lg)"
          />
          <Skeleton></Skeleton>
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  NeighbourhoodState,
  ExpressionTypes,
  FluxExpressionReference,
  ProfileWithDID,
} from "@/store/types";
import { useDataStore } from "@/store/data";

import { getProfile } from "@/utils/profileHelpers";
import { ad4mClient } from "@/app";
import Skeleton from "@/components/skeleton/Skeleton.vue";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { Skeleton },
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
        this.loading = true;
        for (const user of users) {
          const member = await getProfile(user);

          if (member) {
            this.memberList = [...this.memberList, member];
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
    profileLanguageAddress(): string {
      return this.community.typedExpressionLanguages.find(
        (t: FluxExpressionReference) =>
          t.expressionType === ExpressionTypes.ProfileExpression
      )!.languageAddress;
    },
  },
  methods: {
    async profileClick(did: string) {
      const me = await ad4mClient.agent.me();

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
