<template>
  <j-modal size="xs" v-if="isChangeChannel" :open="isChangeChannel">
    <j-box pt="600" pb="800" px="400">
      <j-box pb="300">
        <j-text variant="heading-sm">Select a channel</j-text>
      </j-box>

      <label
        v-for="view in views"
        :class="{ 'tab-modal': true, checked: view.pkg === currentView }"
        @click="() => changeCurrentView(view.pkg)"
      >
        <input type="radio" :name="channel?.id" :checked.prop="view.pkg === currentView" :value.prop="view.pkg" />
        <j-icon :name="view.icon" size="xs" />
        <span>{{ view.name }}</span>
      </label>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useRouteParams } from '@/composables/useRouteParams';
import { restoreChannelPrefix } from '@/utils/routeUtils';
import { App, Channel } from '@coasys/flux-api';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const { channelId } = useRouteParams();
const { perspective, allChannels } = useCommunityService();

const channel = computed(() => allChannels.value.find((c) => c.id === restoreChannelPrefix(channelId.value)));

const currentView = ref<string>('');
const isChangeChannel = ref(false);

const views = ref<App[]>([]);
let channelLoadSeq = 0;
watch(
  channel,
  async (newChannel) => {
    // Only fetch when the modal is actually open — this modal mounts eagerly
    // with ChannelView, so without this guard it fires a redundant Channel query
    // on every channel navigation.
    if (!isChangeChannel.value) return;
    const seq = ++channelLoadSeq;
    if (!newChannel || !perspective) {
      views.value = [];
      return;
    }

    try {
      const result = await App.findAll(perspective, {
        parent: { model: Channel, id: newChannel.id },
      });
      if (seq !== channelLoadSeq) return;
      views.value = result;
    } catch {
      if (seq !== channelLoadSeq) return;
      views.value = [];
    }
  },
  { immediate: true },
);

function changeCurrentView(viewId: string) {
  const { communityId, channelId } = route.params;
  router.push({ name: 'view', params: { communityId, channelId, viewId } });
}
</script>

<style scoped lang="scss">
.tab-modal {
  height: 100%;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  color: var(--j-color-ui-500);
  font-size: var(--j-font-size-500);
  cursor: pointer;
  position: relative;
  padding: var(--j-space-300);
  border-radius: 6px;

  &:hover {
    color: var(--j-color-black);
  }

  &.checked {
    position: relative;
    background: var(--j-color-primary-100);
    color: var(--j-color-black);
  }

  input {
    position: absolute;
    clip: rect(1px 1px 1px 1px);
    clip: rect(1px, 1px, 1px, 1px);
    vertical-align: middle;
  }
}
</style>
