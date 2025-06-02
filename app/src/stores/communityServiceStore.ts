import { CommunityService } from "@/composables/useCommunityService";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useCommunityServiceStore = defineStore(
  "communityServiceStore",
  () => {
    const communityServices = ref<Record<string, CommunityService>>({});

    function addCommunityService(communityId: string, service: CommunityService) {
      communityServices.value[communityId] = service;
    }

    function getCommunityService(communityId: string): CommunityService | undefined {
      return communityServices.value[communityId];
    }

    function deleteCommunityService(communityId: string) {
      delete communityServices.value[communityId];
    }

    return {
      communityServices,
      addCommunityService,
      getCommunityService,
      deleteCommunityService,
    };
  },
  { persist: false }
);
