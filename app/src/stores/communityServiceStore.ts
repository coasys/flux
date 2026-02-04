import { CommunityService } from '@/composables/useCommunityService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCommunityServiceStore = defineStore(
  'communityServiceStore',
  () => {
    const communityServices = ref<Record<string, CommunityService>>({});

    function addCommunityService(communityUrl: string, service: CommunityService) {
      console.log('Adding community service for:', communityUrl);
      communityServices.value[communityUrl] = service;
    }

    function getCommunityService(communityUrl: string): CommunityService | undefined {
      // console.log('999 Getting community service for:', communityUrl);
      // console.log('999 Available community services:', communityServices.value);
      // console.log('999 Community service found:', communityServices.value[communityUrl]);
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
