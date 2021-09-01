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
      <j-flex wrap gap="600">
        <j-flex
          gap="300"
          v-for="communityMember in filteredCommunityMemberList"
          :key="communityMember.did"
          inline
          direction="column"
          a="center"
        >
          <j-avatar
            size="lg"
            :hash="communityMember.did"
            :src="communityMember.profile.profilePicture"
          />
          <j-text variant="body">
            {{ communityMember.profile.username }}
          </j-text>
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { Expression } from "@perspect3vism/ad4m";
import { NeighbourhoodState, Profile } from "@/store/types";
import { useDataStore } from "@/store/data";

import { parseProfile } from "@/utils/profileHelpers";

export default defineComponent({
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  mounted() {
    this.dataStore.getNeighbourhoodMembers(this.community.perspective.uuid);
  },
  data() {
    return {
      searchValue: "",
    };
  },
  computed: {
    community(): NeighbourhoodState {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getNeighbourhood(id);
    },
    filteredCommunityMemberList(): { did: string; profile: Profile }[] {
      const members: Expression[] = Object.values(this.community.members);
      return members
        .map((expression: Expression) => ({
          did: expression.author,
          profile: parseProfile(expression.data.profile),
        }))
        .filter((member: { did: string; profile: Profile }) =>
          member.profile.username.includes(this.searchValue)
        );
    },
  },
});
</script>
