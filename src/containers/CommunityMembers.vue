<template>
  <j-box p="800">
    <j-flex gap="500" direction="column">
      <j-text variant="heading"
        >All group members ({{ community.members.length ?? 0 }})</j-text
      >
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
          :key="communityMember.author"
          inline
          direction="column"
          a="center"
        >
          <j-avatar
            size="lg"
            :hash="communityMember.author"
            :src="
              communityMember.data.profile['schema:image']
                ? JSON.parse(communityMember.data.profile['schema:image'])[
                    'schema:contentUrl'
                  ]
                : null
            "
          />
          <j-text variant="body">
            {{ communityMember.data.profile["foaf:AccountName"] }}
          </j-text>
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { Expression } from "@perspect3vism/ad4m-types";
import { NeighbourhoodState } from "@/store/types";
import store from "@/store";

export default defineComponent({
  emits: ["cancel", "submit"],
  mounted() {
    store.dispatch.getNeighbourhoodMembers(this.community.perspective.uuid);
  },
  data() {
    return {
      searchValue: "",
    };
  },
  computed: {
    community(): NeighbourhoodState {
      const id = this.$route.params.communityId.toString();
      return store.getters.getNeighbourhood(id);
    },
    filteredCommunityMemberList(): Expression[] {
      const members: Expression[] = this.community.members;
      return members.filter((m: Expression) =>
        Object(m.data).profile["foaf:AccountName"].includes(this.searchValue)
      );
    },
  },
});
</script>
