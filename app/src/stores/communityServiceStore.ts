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
      const service = communityServices.value[communityId];
      if (!service) console.warn(`No community service found for ID: ${communityId}`);
      return service;
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
