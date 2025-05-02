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
        :value="searchInput"
        @input="(e: any) => (searchInput = e.target.value)"
      >
        <j-icon name="search" size="sm" slot="start"></j-icon>
      </j-input>

      <j-flex direction="column" gap="400" v-if="members.length">
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
          <j-avatar size="xl" :did="member.did" :hash="member.did" :src="member.profileThumbnailPicture" />
          <j-text color="black" nomargin variant="body">
            {{ member.username }}
          </j-text>
        </j-flex>
      </j-flex>

      <j-flex direction="column" gap="400" v-else>
        <j-flex inline direction="row" j="center" a="center" gap="500" v-for="i in 4" :key="i">
          <j-skeleton :key="i" variant="circle" width="xl" height="xl" />
          <j-skeleton width="xl" height="text" />
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { useAppStore } from "@/store/app";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const emit = defineEmits(["close", "submit"]);
const router = useRouter();
const appStore = useAppStore();
const { me, activeCommunityId } = storeToRefs(appStore);
const { members, membersLoading, getMembers } = useCommunityService();

const searchInput = ref("");

const filteredMembers = computed(() => {
  if (!searchInput.value) return members.value;

  // Filter members based on the search input
  return members.value.filter((member) => {
    const { username, givenName, familyName } = member;
    const stringValues = [username, givenName, familyName].filter(Boolean);
    return stringValues.some((field) => field.toLowerCase().includes(searchInput.value.toLowerCase()));
  });
});

async function profileClick(did: string) {
  emit("close");

  // If my DID navigate to my profile
  if (did === me.value.did) router.push({ name: "home", params: { did } });
  // Otherwise navigate to the other members profile
  else router.push({ name: "profile", params: { did, communityId: activeCommunityId.value } });
}

// Refetch members every time the modal is opened
onMounted(() => getMembers());
</script>
