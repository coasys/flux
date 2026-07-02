<template>
  <div class="init-community">
    <div class="init-community__card">
      <template v-if="perspective">
        <j-avatar
          :initials="perspective.name.charAt(0).toUpperCase()"
          size="xl"
        />

        <j-flex direction="column" a="center" gap="200">
          <j-text variant="heading">{{ perspective.name }}</j-text>
          <j-text variant="body" color="color-text-muted" style="text-align: center">
            This space doesn't have a Flux community yet. Initialize one to start using channels,
            conversations, and other Flux features here.
          </j-text>
        </j-flex>

        <j-button
          size="lg"
          variant="primary"
          :loading="initializing"
          :disabled="initializing"
          @click="initCommunity"
        >
          <j-icon name="plus" slot="start" />
          Initialize Flux Community
        </j-button>
      </template>

      <template v-else>
        <j-icon name="exclamation-triangle" size="xl" color="danger-500" />
        <j-flex direction="column" a="center" gap="200">
          <j-text variant="heading">Space not accessible</j-text>
          <j-text variant="body" color="color-text-muted" style="text-align: center">
            This space is not available in Flux.
          </j-text>
        </j-flex>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { stripNeighbourhoodPrefix, restoreNeighbourhoodPrefix } from '@/utils/routeUtils';
import { createCommunity } from '@coasys/flux-api';
import { PerspectiveProxy } from '@coasys/ad4m';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ communityId: string }>();

const appStore = useAppStore();
const router = useRouter();

const initializing = ref(false);

// Find the perspective by communityId (which is either a stripped neighbourhood URL or a raw UUID)
const perspective = computed((): PerspectiveProxy | undefined => {
  return appStore.myPerspectives.find((p) => {
    if (p.sharedUrl) return stripNeighbourhoodPrefix(p.sharedUrl) === props.communityId;
    return p.uuid === props.communityId;
  });
});

async function initCommunity() {
  if (!perspective.value || initializing.value) return;
  initializing.value = true;
  try {
    await createCommunity({
      perspectiveUuid: perspective.value.uuid,
      name: perspective.value.name,
      client: appStore.ad4mClient,
    });
    await appStore.getMyCommunities();
    router.push({ name: 'community', params: { communityId: props.communityId } });
  } catch (error) {
    console.error('Failed to initialize Flux community:', error);
    appStore.showDangerToast({ message: 'Failed to initialize Flux community.' });
  } finally {
    initializing.value = false;
  }
}
</script>

<style scoped>
.init-community {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.init-community__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--j-space-600);
  max-width: 400px;
  padding: var(--j-space-800);
  text-align: center;
}
</style>
