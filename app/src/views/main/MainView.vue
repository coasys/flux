<template>
  <AppLayout>
    <template v-slot:sidebar>
      <Sidebar />
    </template>

    <template v-slot:call-container>
      <CallContainer />
    </template>

    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['CommunityView']" :max="5">
        <component :is="Component" :key="route.params.communityId" />
      </KeepAlive>
    </RouterView>

    <Modals />
  </AppLayout>
</template>

<script setup lang="ts">
import CallContainer from '@/containers/CallContainer.vue';
import AppLayout from '@/layout/AppLayout.vue';
import { useAppStore } from '@/stores';
import Modals from '@/views/main/modals/Modals.vue';
import Sidebar from '@/views/main/sidebar/Sidebar.vue';
import { usePerspectives } from '@coasys/flux-vue';
import { ensureLLMTasks } from '@coasys/flux-api/src/conversation/LLMutils';
import semver from 'semver';
import { onMounted } from 'vue';
import { dependencies } from '../../../package.json';
import { registerNotification } from '../../utils/registerMobileNotifications';

const appStore = useAppStore();

usePerspectives(appStore.ad4mClient);

// Todo: move this initialisation into a composable or higher component?
async function initializeApp() {
  // Add notification callback
  await appStore.ad4mClient.runtime.addNotificationTriggeredCallback((notification: any) => {
    console.log('notification', notification);
    return null;
  });

  // Register notification
  registerNotification(appStore.ad4mClient);

  // Ensure LLM tasks are set up
  ensureLLMTasks(appStore.ad4mClient.ai);

  // Todo: Version checking for ad4m / flux compatibility
  const { ad4mExecutorVersion } = await appStore.ad4mClient.runtime.info();
  const isIncompatible = semver.gt(dependencies['@coasys/ad4m'], ad4mExecutorVersion);
  if (isIncompatible) {
    // this.$router.push({ name: "update-ad4m" });
  }
}

onMounted(async () => initializeApp());
</script>
