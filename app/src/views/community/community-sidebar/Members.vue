<template>
  <j-box pt="500">
    <j-menu-group open :title="`Members (${dids?.length})`">
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
          :users="dids || []"
        />
      </j-box>
    </j-menu-group>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { mapActions } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { useEntries, useEntry, usePerspective } from "@fluxapp/vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { Member } from "@fluxapp/api";
import { useRoute } from "vue-router";
import { computed } from "@vue/reactivity";

export default defineComponent({
  components: { AvatarGroup },
  async setup() {
    const { params } = useRoute();
    const client = await getAd4mClient();

    const { data } = usePerspective(client, () => params.communityId as string);

    const { entries: members } = useEntries({
      perspective: () => data.value.perspective,
      source: () => "ad4m://self",
      model: Member,
    });

    const dids = computed(() => members.value.map((m) => m.id));

    return {
      data,
      dids,
      dataStore: useDataStore(),
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
