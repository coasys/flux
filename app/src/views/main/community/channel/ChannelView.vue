<template>
  <div id="channel-view" class="channel-view" v-if="channel">
    <Header />

    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['ViewView']" :max="10">
        <component
          v-if="route.params.communityId === communityId && route.params.channelId === channelId"
          class="perspective-view"
          :key="`${channelId}-${route.params.viewId}`"
          :is="Component"
          :channel="channel"
          :style="{ paddingBottom: isMobile ? `calc(${callWidgetsHeight + 20}px)` : '0' }"
        />
      </KeepAlive>
    </RouterView>

    <Modals />
  </div>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useUiStore } from '@/stores';
import Header from '@/views/main/community/channel/Header.vue';
import Modals from '@/views/main/community/channel/modals/Modals.vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'ChannelView' });
const { communityId, channelId, viewId } = defineProps({
  communityId: { type: String },
  channelId: { type: String },
  viewId: { type: String },
});

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();

const { allChannels } = useCommunityService();
const { isMobile, callWidgetsHeight } = storeToRefs(uiStore);

const channel = computed(() => allChannels.value.find((c) => c.baseExpression === channelId));

onMounted(() => {
  // Navigate to the conversation or conversations view if no viewId present when entering channel
  const newViewId = `conversation${channel.value?.isConversation ? '' : 's'}`;
  if (!viewId) router.push({ name: 'view', params: { viewId: newViewId } });
});
</script>

<style scoped lang="scss">
.channel-view {
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--app-channel-bg-color, transparent);
  width: 100%;
  height: 100vh;

  .perspective-view {
    position: relative;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}
</style>
