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
import {
  NeighbourhoodState,
  Profile,
  ExpressionTypes,
  FluxExpressionReference,
} from "@/store/types";
import { useDataStore } from "@/store/data";

import { getProfile, parseProfile } from "@/utils/profileHelpers";

export default defineComponent({
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
      profileLinksWorker: null as null | Worker,
    };
  },
  async mounted() {
    this.profileLinksWorker = await this.dataStore.getNeighbourhoodMembers(
      this.community.perspective.uuid
    );
  },
  unmounted() {
    this.profileLinksWorker?.terminate();
  },
  data() {
    return {
      searchValue: "",
    };
  },
  //@LEIF: HELP
  asyncComputed: {
    async filteredCommunityMemberList(): Promise<
      ({ did: string; profile: Profile } | undefined)[]
    > {
      const members = await Promise.all(
        this.community.members.map(async (did: string) => {
          const profile = await getProfile(this.profileLanguageAddress, did);
          if (profile) {
            return {
              did: did,
              profile: parseProfile(profile),
            };
          }
        })
      );
      const filtered = members.filter((member) => {
        if (member != undefined) {
          return member.profile.username.includes(this.searchValue);
        } else {
          return false;
        }
      });
      return filtered;
    },
  },
  computed: {
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
});
</script>
