<template>
  <j-box p="800">
    <j-flex gap="500" direction="column">
      <j-text nomargin variant="heading-sm">
        Members {{ filteredMembers.length ? `(${filteredMembers.length})` : "" }}
      </j-text>
      <j-input
        size="lg"
        placeholder="Search members..."
        type="search"
        :value="search"
        @input="(e: any) => (search = e.target.value)"
      >
        <j-icon name="search" size="sm" slot="start"></j-icon>
      </j-input>
      <j-flex direction="column" gap="400" v-if="!loading">
        <j-flex
          gap="500"
          style="cursor: pointer"
          v-for="member in filteredMembers"
          :key="member.did"
          inline
          direction="row"
          j="center"
          a="center"
          @click="() => profileClick(member.did)"
        >
          <Avatar
            size="xl"
            :did="member.did"
            :src="member.profileThumbnailPicture"
          ></Avatar>
          <j-text color="black" nomargin variant="body">
            {{ member.username }}
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
          <j-skeleton width="xl" height="text" />
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, watch, ref, computed } from "vue";
import { Community } from "@coasys/flux-api";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import Avatar from "@/components/avatar/Avatar.vue";
import { usePerspective, useModel } from "@coasys/ad4m-vue-hooks";
import { useRoute, useRouter } from "vue-router";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
import { Profile } from "@coasys/flux-types";

export default defineComponent({
  emits: ["close", "submit"],
  components: { Avatar },
  async setup(_, { emit }) {
    const route = useRoute();
    const router = useRouter();

    const loading = ref(true);
    const members = ref<Profile[]>([]);
    const search = ref('');
    const perspectiveUuid = computed(() => data.value?.perspective?.uuid);

    const client = await getAd4mClient();
    const { data } = usePerspective(client, () => route.params.communityId);

    const { entries: communities } = useModel({
      perspective: computed(() => data.value.perspective),
      model: Community,
    });

    const filteredMembers = computed(() => {
      if (!search.value) return members.value;
      
      return members.value.filter((member) => {
        const { username, givenName, familyName } = member;
        const stringValues = [username, givenName, familyName].filter(Boolean);
        return stringValues.some((field) => field.toLowerCase().includes(search.value.toLowerCase()));
      });
    });

    async function getMembers() {
      loading.value = true;
      try {
        // Get the members from the neighbourhood
        const neighbourhood = data.value.perspective?.getNeighbourhoodProxy();
        if (neighbourhood) {
          const me = await client.agent.me();
          const others = await neighbourhood?.otherAgents() || [];
          // Get the profiles from each members DID
          members.value = await Promise.all(
            [...others, me.did].map((did) => getCachedAgentProfile(did))
          );
        }
      } catch (e) {
        console.error("Error getting members", e);
      } finally {
        loading.value = false;
      }
    }

    async function profileClick(did: string) {
      emit("close");
      const me = await client.agent.me();
      // Navigate to my profile
      if (did === me.did) router.push({ name: "home", params: { did } });
      // Navigate to the other members profile
      else router.push({ name: "profile", params: { did, communityId: route.params.communityId } });
    }

    watch(perspectiveUuid,
      async (newUuid, oldUuid) => {
        if (newUuid !== oldUuid) await getMembers();
      },
      { immediate: true }
    );

    return {
      loading,
      members,
      filteredMembers,
      search,
      community: computed(() => communities.value[0]),
      profileClick,

    };
  },
});
</script>
