<template>
  <j-box pt="500">
    <j-menu-group open :title="`Members (${others?.length})`">
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
          :users="others || []"
        />
      </j-box>
    </j-menu-group>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref, watch, watchEffect } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { mapActions } from "pinia";
import { useAppStore } from "@/store/app";
import { usePerspective } from "@coasys/vue-hooks";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { useRoute } from "vue-router";

export default defineComponent({
  components: { AvatarGroup },
  async setup() {
    const route = useRoute();
    const client = await getAd4mClient();
    const others = ref<string[]>([]);

    const { data } = usePerspective(
      client,
      () => route.params.communityId as string
    );

    watchEffect(async () => {
      // TODO: how to watch for the uuid change, without having an unused var
      const uuid = data.value.perspective?.uuid;
      const neighbourhood = data.value.perspective?.getNeighbourhoodProxy();
      if (neighbourhood) {
        const me = await client.agent.me();
        const agents = await neighbourhood?.otherAgents();
        others.value = [...agents, me.did];
      }
    });

    return {
      data,
      others,
    };
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCommunityMembers",
      "setShowInviteCode",
    ]),
  },
});
</script>
