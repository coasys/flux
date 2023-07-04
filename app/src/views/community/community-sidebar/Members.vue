<template>
  <j-box pt="500">
    <j-menu-group open :title="`Members (${otherAgents.length + 1})`">
      <j-button
        @click.prevent="() => setShowInviteCode(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <j-box px="500">
        <avatar-group
          @click="() => setShowCommunityMembers(true)"
          :users="otherAgents"
        />
      </j-box>
    </j-menu-group>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { mapActions } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";

export default defineComponent({
  components: { AvatarGroup },
  async mounted() {
    const client = await getAd4mClient();
    const perspective = await client.perspective.byUUID(
      this.$route.params.communityId as string
    );
    const otherAgents = await perspective
      ?.getNeighbourhoodProxy()
      .otherAgents();
    this.otherAgents = otherAgents || [];
  },
  setup() {
    return {
      dataStore: useDataStore(),
      otherAgents: ref<string[]>([]),
    };
  },
  computed: {
    community() {
      const communityId = this.$route.params.communityId as string;
      return this.dataStore.getCommunityState(communityId);
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCommunityMembers",
      "setShowInviteCode",
    ]),
  },
});
</script>
