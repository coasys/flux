<template>
  <j-box pt="500">
    <j-menu-group open :title="`Members ${loading ? '' : `(${members.length})`}`">
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
          :loading="loading"
          :users="members"
        />
      </j-box>
    </j-menu-group>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { mapActions } from "pinia";
import { useAppStore } from "@/store/app";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";

export default defineComponent({
  components: { AvatarGroup },
  props: {
    perspective: {
      type: Object, // PerspectiveProxy,
      required: true,
    },
  },
  async setup(props) {
    const client = await getAd4mClient();
    const loading = ref(true);
    const members = ref<Profile[]>([]);
    let currentPerspectiveUuid = props.perspective.uuid

    watch(
      () => props.perspective.uuid,
      async (newUuid, oldUuid) => {
        if (newUuid !== oldUuid) {
          loading.value = true;

          // Store the current perspectives uuid so we can skip stale results if the perspective changes before the other agents are returned
          currentPerspectiveUuid = newUuid

          // Get the members from the neighbourhood
          const neighbourhood = props.perspective.getNeighbourhoodProxy();
          const me = await client.agent.me();
          const others = await neighbourhood?.otherAgents() || [];

          // If the perspective has already changed, skip the stale result
          if (newUuid !== currentPerspectiveUuid) return;

          // Get the profiles from each members DID
          members.value = await Promise.all(
            [...others, me.did].map((did) => getCachedAgentProfile(did))
          );
          
          loading.value = false;
        }
      },
      { immediate: true }
    );

    return { loading, members };
  },
  methods: {
    ...mapActions(useAppStore, ["setShowCommunityMembers", "setShowInviteCode" ]),
  },
});
</script>
