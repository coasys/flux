import { CommunityService } from '@/composables/useCommunityService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCommunityServiceStore = defineStore(
  'communityServiceStore',
  () => {
    const communityServices = ref<Record<string, CommunityService>>({});

    function addCommunityService(communityUrl: string, service: CommunityService) {
      communityServices.value[communityUrl] = service;
    }

    function getCommunityService(communityUrl: string): CommunityService | undefined {
      return communityServices.value[communityUrl];
    }

    function deleteCommunityService(communityUrl: string) {
      delete communityServices.value[communityUrl];
    }

    return {
      communityServices,
      addCommunityService,
      getCommunityService,
      deleteCommunityService,
    };
  },
  { persist: false },
);
