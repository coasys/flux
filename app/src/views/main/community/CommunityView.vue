<template>
  <CommunityLayout>
    <template v-slot:sidebar>
      <Sidebar />
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

    <Modals />

    <!-- TODO: Move the logic below into seperate componenets -->

    <div v-if="!isSynced && !route.params.channelId" class="center">
      <j-box py="800">
        <j-flex gap="400" direction="column" a="center" j="center">
          <j-box pb="500">
            <HourglassIcon />
          </j-box>

          <j-flex direction="column" a="center">
            <j-text color="black" size="700" weight="800"> Syncing community </j-text>
            <j-text size="400" weight="400">
              Note: Flux is P2P, you will not receive any data until another user is online
            </j-text>
          </j-flex>
        </j-flex>
      </j-box>
    </div>

    <div class="center" v-if="isSynced && !route.params.channelId && community && channelsWithConversations.length">
      <div class="center-inner">
        <j-flex gap="600" direction="column" a="center" j="center">
          <j-avatar :initials="`${community?.name}`.charAt(0)" size="xxl" :src="community.thumbnail || null" />

          <j-flex direction="column" a="center">
            <j-text variant="heading"> Welcome to {{ community.name }}! </j-text>
          </j-flex>

          <j-button @click="() => startNewConversation()" :loading="newConversationLoading" variant="primary" size="xl">
            <j-icon name="door-open" />
            Start a conversation
          </j-button>

          <j-box pt="500">
            <j-flex direction="column" a="center">
              <j-text variant="ingress" nomargin>Or pick a channel:</j-text>
            </j-flex>
          </j-box>

          <div class="channel-card-grid">
            <button
              v-for="channelData in channelsWithConversations"
              class="channel-card"
              @click="() => navigateToChannel(channelData.channel.baseExpression)"
            >
              # {{ channelData.channel.name }}
            </button>
          </div>
        </j-flex>
      </div>
    </div>

    <div class="center" v-if="isSynced && !route.params.channelId && channelsWithConversations.length === 0">
      <div class="center-inner">
        <j-flex gap="500" direction="column" a="center" j="center">
          <j-avatar :initials="`${community?.name}`.charAt(0)" size="xxl" :src="community?.thumbnail || null" />

          <j-flex direction="column" a="center">
            <j-text variant="heading"> Welcome to {{ community?.name }}! </j-text>
          </j-flex>

          <j-box pt="500">
            <j-flex gap="500" direction="column" a="center" j="center">
              <j-button
                @click="() => startNewConversation()"
                :loading="newConversationLoading"
                variant="primary"
                size="xl"
              >
                <j-icon name="door-open" />
                Start a conversation
              </j-button>

              <j-text nomargin>Or</j-text>

              <j-flex direction="column" a="center">
                <j-button size="xl" @click="() => (modalStore.showCreateChannel = true)">
                  <j-icon name="balloon" />
                  Create a new channel
                </j-button>
              </j-flex>
            </j-flex>
          </j-box>
        </j-flex>
      </div>
    </div>
  </CommunityLayout>
</template>

<script setup lang="ts">
import { HourglassIcon } from '@/components/icons';
import { CommunityServiceKey, createCommunityService } from '@/composables/useCommunityService';
import CommunityLayout from '@/layout/CommunityLayout.vue';
import { useCommunityServiceStore, useModalStore } from '@/stores';
import Modals from '@/views/main/community/modals/Modals.vue';
import Sidebar from '@/views/main/community/sidebar/Sidebar.vue';
import { onMounted, onUnmounted, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'CommunityView' });
const { communityId, channelId } = defineProps({
  communityId: { type: String, required: true },
  channelId: { type: String },
});

const route = useRoute();
const router = useRouter();
const modalStore = useModalStore();
const communityServiceStore = useCommunityServiceStore();

// Initialize the community service & add it to the community service store
const communityService = await createCommunityService();
provide(CommunityServiceKey, communityService);
communityServiceStore.addCommunityService(communityId, communityService);
const {
  community,
  isSynced,
  channelsWithConversations,
  signallingService,
  newConversationLoading,
  startNewConversation,
} = communityService;

function navigateToChannel(channelId?: string) {
  router.push({ name: 'channel', params: { communityId, channelId } });
}

onMounted(() => signallingService.startSignalling());
onUnmounted(() => signallingService.stopSignalling());
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
