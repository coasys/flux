<template>
  <CommunityLayout>
    <template v-slot:sidebar>
      <CommunitySidebar />
    </template>

    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['ChannelView']" :max="5">
        <component
          v-if="route.params.communityId === communityId"
          :is="Component"
          :key="channelId"
          style="height: 100%"
        />
      </KeepAlive>
    </RouterView>

    <j-modal
      size="sm"
      :style="{ height: 500 }"
      :open="modals.showCommunityMembers"
      @toggle="(e: any) => modals.setShowCommunityMembers(e.target.open)"
    >
      <CommunityMembers @close="() => modals.setShowCommunityMembers(false)" v-if="modals.showCommunityMembers" />
    </j-modal>

    <div v-if="!isSynced && !route.params.channelId" class="center">
      <j-box py="800">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-box pb="500">
            <Hourglass />
          </j-box>

          <j-flex direction="column" a="center">
            <j-text color="black" size="700" weight="800"> Syncing community </j-text>
            <j-text size="400" weight="400"
              >Note: Flux is P2P, you will not receive any data until another user is online
            </j-text>
          </j-flex>
        </j-flex>
      </j-box>
    </div>

    <div class="center" v-if="isSynced && !route.params.channelId && community && channels.length">
      <div class="center-inner">
        <j-flex gap="600" direction="column" a="center" j="center">
          <j-avatar :initials="`${community?.name}`.charAt(0)" size="xxl" :src="community.thumbnail || null" />

          <j-box a="center" pb="300">
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

    <div class="center" v-if="isSynced && !route.params.channelId && channels.length === 0">
      <div class="center-inner">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-icon color="ui-500" size="xl" name="balloon"></j-icon>

          <j-flex direction="column" a="center">
            <j-text nomargin color="black" size="700" weight="800"> No channels yet </j-text>
            <j-text size="400" weight="400">Be the first to make one!</j-text>
            <j-button variant="primary" @click="() => modals.setShowCreateChannel(true)">
              Create a new channel
            </j-button>
          </j-flex>
        </j-flex>
      </div>
    </div>
  </CommunityLayout>
</template>

<script setup lang="ts">
import Hourglass from "@/components/hourglass/Hourglass.vue";
import { CommunityServiceKey, createCommunityService } from "@/composables/useCommunityService";
import CommunityMembers from "@/containers/CommunityMembers.vue";
import CommunityLayout from "@/layout/CommunityLayout.vue";
import { useModalStore } from "@/store";
import CommunitySidebar from "@/views/main/community/community-sidebar/CommunitySidebar.vue";
import { RouteParams } from "@coasys/flux-types";
import { onBeforeUnmount, onMounted, provide, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({ name: "CommunityView" });
const { communityId, channelId } = defineProps({
  communityId: { type: String },
  channelId: { type: String },
});

const route = useRoute();
const router = useRouter();
const modals = useModalStore();

// Initialize community service
const communityService = await createCommunityService();
provide(CommunityServiceKey, communityService);
const { community, isSynced, channels, signallingService } = communityService;

function navigateToChannel(channelId: string) {
  router.push({ name: "channel", params: { communityId, channelId } });
}

onMounted(async () => {
  console.log("*** community mounted", communityId);
});

onBeforeUnmount(() => signallingService.stopSignalling());

watch(
  () => route.params,
  (newParams: RouteParams) => {
    if (newParams.communityId === communityId)
      signallingService.setRouteParams({
        communityId: newParams.communityId,
        channelId: newParams.channelId,
        viewId: newParams.viewId,
      });
  },
  { immediate: true }
);
</script>

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
