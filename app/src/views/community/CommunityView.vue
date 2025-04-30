<template>
  <sidebar-layout v-if="!communityLoading">
    <template v-slot:sidebar>
      <community-sidebar />
    </template>

    <!-- <div
      style="height: 100%"
      v-for="channel in channels"
      :key="channel?.baseExpression"
      :style="{
        height: channel?.baseExpression === channelId ? '100%' : '0',
      }"
    >
      <channel-view
        v-if="loadedChannels[channel?.baseExpression]"
        v-show="channel?.baseExpression === channelId"
        :channelId="channel?.baseExpression"
        :communityId="communityId"
      ></channel-view>
    </div>

    <div v-if="!isSynced && !channelId" class="center">
      <j-box py="800">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-box pb="500">
            <Hourglass></Hourglass>
          </j-box>
          <j-flex direction="column" a="center">
            <j-text color="black" size="700" weight="800">
              Syncing community
            </j-text>
            <j-text size="400" weight="400"
              >Note: Flux is P2P, you will not receive any data until another
              user is online
            </j-text>
          </j-flex>
        </j-flex>
      </j-box>
    </div>

    <div
      class="center"
      v-if="isSynced && !channelId && community && channels.length"
    >
      <div class="center-inner">
        <j-flex gap="600" direction="column" a="center" j="center">
          <j-avatar
            :initials="`${community?.name}`.charAt(0)"
            size="xxl"
            :src="community.thumbnail || null"
          />
          <j-box align="center" pb="300">
            <j-text variant="heading"> Welcome to {{ community.name }} </j-text>
            <j-text variant="ingress">Pick a channel</j-text>
          </j-box>

          <div class="channel-card-grid">
            <button
              class="channel-card"
              @click="() => navigateToChannel(channel.baseExpression)"
              v-for="channel in channels"
            >
              # {{ channel.name }}
            </button>
          </div>
        </j-flex>
      </div>
    </div>

    <div class="center" v-if="isSynced && !channelId && channels.length === 0">
      <div class="center-inner">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-icon color="ui-500" size="xl" name="balloon"></j-icon>
          <j-flex direction="column" a="center">
            <j-text nomargin color="black" size="700" weight="800">
              No channels yet
            </j-text>
            <j-text size="400" weight="400">Be the first to make one!</j-text>
            <j-button
              variant="primary"
              @click="() => setShowCreateChannel(true)"
            >
              Create a new channel
            </j-button>
          </j-flex>
        </j-flex>
      </div>
    </div> -->
  </sidebar-layout>
</template>

<script setup lang="ts">
import { CommunityServiceKey, createCommunityService } from "@/composables/useCommunityService";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import { provide } from "vue";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";

type LoadedChannels = {
  [channelId: string]: boolean;
};

// Initialize community service
const communityService = await createCommunityService();
provide(CommunityServiceKey, communityService);
const { communityLoading } = communityService;

//     return {
//       loading,
//       serviceReady,
//       appStore, // Todo remove if not needed

//       community,
//       communityId: uuid,
//       channels,
//       // data,
//       // hasCopied: ref(false),
//       loadedChannels: ref<LoadedChannels>({}),
//       // appStore: useAppStore(),
//     };
//   },
//   watch: {
//     // "$route.params.communityId": {
//     //   handler: function (id: string) {
//     //     if (id) {
//     //       this.handleThemeChange(id);
//     //     } else {
//     //       this.handleThemeChange();
//     //     }
//     //   },
//     //   deep: true,
//     //   immediate: true,
//     // },
//     // "$route.params.channelId": {
//     //   handler: function (id: string) {
//     //     if (id) {
//     //       this.loadedChannels = {
//     //         ...this.loadedChannels,
//     //         [id]: true,
//     //       };
//     //     }
//     //   },
//     //   immediate: true,
//     // },
//   },
//   methods: {
//     ...mapActions(useAppStore, [
//       "setShowCreateChannel",
//       "setShowEditCommunity",
//       "setShowEditChannel",
//       "setShowCommunityMembers",
//       "setShowInviteCode",
//       "setShowCommunitySettings",
//     ]),
//     navigateToChannel(channelId: string) {
//       this.$router.push({
//         name: "channel",
//         params: {
//           communityId: this.communityId,
//           channelId: channelId,
//         },
//       });
//     },
//     // handleThemeChange(id?: string) {
//     //   if (!id) {
//     //     this.appStore.changeCurrentTheme("global");
//     //     return;
//     //   } else {
//     //     // TODO: Change community theme
//     //     // this.appStore.changeCurrentTheme(
//     //     //   this.communityState.state?.useLocalTheme ? id : "global"
//     //     // );
//     //   }
//     // },
//   },
//   computed: {
//     isSynced(): boolean {
//       return true
//       // return this.data.perspective?.state === PerspectiveState.Synced;
//     },
//     // community(): Community | null {
//     //   return this.communities[this.$route.params.communityId as string];
//     // },
//     // communityId() {
//     //   return this.$route.params.communityId as string;
//     // },
//     channelId() {
//       return this.$route.params.channelId as string;
//     },
//     modals(): ModalsState {
//       return this.appStore.modals;
//     },
//   },
// });
</script>

<!-- <script lang="ts">
import SidebarLayout from "@/layout/SidebarLayout.vue";
import { defineComponent, ref, computed, provide, watch } from "vue";
import { useRoute } from "vue-router";
import CommunitySidebar from "./community-sidebar/CommunitySidebar.vue";
import Hourglass from "@/components/hourglass/Hourglass.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import { useAppStore } from "@/store/app";
import { ModalsState } from "@/store/types";
import { PerspectiveState, PerspectiveProxy } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { usePerspective, usePerspectives, useModel } from "@coasys/ad4m-vue-hooks";
import { Channel, Community } from "@coasys/flux-api";
import { useCommunities } from "@coasys/flux-vue";
import { mapActions } from "pinia";
import { createCommunityService, CommunityServiceKey } from "@/composables/useCommunityService";

type LoadedChannels = {
  [channelId: string]: boolean;
};

export default defineComponent({
  name: "CommunityView",
  components: {
    ChannelView,
    CommunitySidebar,
    SidebarLayout,
    Hourglass,
  },
  async setup() {
    const appStore = useAppStore();
    
    provide('test', 'yoooo')
    // console.log('serviceReady 1', serviceReady.value);

    const route = useRoute();
    const client = await getAd4mClient();

    // Extract the communities UUID from the route parameters
    const { communityId } = route.params;
    const uuid = Array.isArray(communityId) ? communityId[0] : communityId;
  
    // Initialize the community service
    const perspective = await client.perspective.byUUID(uuid) as PerspectiveProxy;
    const communityService = createCommunityService(client, perspective)
    // serviceRef.value = communityService
    // provide('ABC', communityService)

    // serviceReady.value = true;


    const { loading, community, channels } = communityService

    watch(() => loading.value, (newLoadingState) => {
      if (newLoadingState) {
        console.log('*** service loading:', newLoadingState);
      }
    }, { immediate: true });

    watch(() => community.value, (newCommunity) => {
      if (newCommunity) {
        console.log('*** newCommunity', newCommunity);
      }
    }, { immediate: true });

    // console.log('serviceReady2', serviceReady.value);

    return {
      loading,
      serviceReady,
      appStore, // Todo remove if not needed

      community,
      communityId: uuid,
      channels,
      // data,
      // hasCopied: ref(false),
      loadedChannels: ref<LoadedChannels>({}),
      // appStore: useAppStore(),
    };
  },
  watch: {
    // "$route.params.communityId": {
    //   handler: function (id: string) {
    //     if (id) {
    //       this.handleThemeChange(id);
    //     } else {
    //       this.handleThemeChange();
    //     }
    //   },
    //   deep: true,
    //   immediate: true,
    // },
    // "$route.params.channelId": {
    //   handler: function (id: string) {
    //     if (id) {
    //       this.loadedChannels = {
    //         ...this.loadedChannels,
    //         [id]: true,
    //       };
    //     }
    //   },
    //   immediate: true,
    // },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowEditChannel",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    navigateToChannel(channelId: string) {
      this.$router.push({
        name: "channel",
        params: {
          communityId: this.communityId,
          channelId: channelId,
        },
      });
    },
    // handleThemeChange(id?: string) {
    //   if (!id) {
    //     this.appStore.changeCurrentTheme("global");
    //     return;
    //   } else {
    //     // TODO: Change community theme
    //     // this.appStore.changeCurrentTheme(
    //     //   this.communityState.state?.useLocalTheme ? id : "global"
    //     // );
    //   }
    // },
  },
  computed: {
    isSynced(): boolean {
      return true
      // return this.data.perspective?.state === PerspectiveState.Synced;
    },
    // community(): Community | null {
    //   return this.communities[this.$route.params.communityId as string];
    // },
    // communityId() {
    //   return this.$route.params.communityId as string;
    // },
    channelId() {
      return this.$route.params.channelId as string;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
});
</script> -->

<style scoped>
.center {
  height: 100%;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-inner {
  display: block;
  width: 100%;
  max-height: 100%;
  padding: var(--j-space-500);
}

.channel-card-grid {
  display: grid;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--j-space-500);
}

.channel-card {
  background-color: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  color: inherit;
  font-size: inherit;
  display: block;
  width: 100%;
  font-weight: 600;
  padding: var(--j-space-500);
  border: 1px solid var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
}

.channel-card:hover {
  border: 1px solid var(--j-color-primary-500);
}
</style>
