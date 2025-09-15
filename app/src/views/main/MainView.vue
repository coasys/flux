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
import { ad4mConnect } from "@/ad4mConnect";
import CallContainer from "@/containers/CallContainer.vue";
import AppLayout from "@/layout/AppLayout.vue";
import { useAppStore } from "@/stores";
import Modals from "@/views/main/modals/Modals.vue";
import Sidebar from "@/views/main/sidebar/Sidebar.vue";
import { LinkExpression, Literal, PerspectiveProxy } from "@coasys/ad4m";
import { usePerspectives } from "@coasys/ad4m-vue-hooks";
import { ensureLLMTasks } from "@coasys/flux-api/src/conversation/LLMutils";
import { EntryType } from "@coasys/flux-types";
import semver from "semver";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { dependencies } from "../../../package.json";
import { registerNotification } from "../../utils/registerMobileNotifications";

const route = useRoute();
const appStore = useAppStore();

const { onLinkAdded } = usePerspectives(appStore.ad4mClient);

const oldAuthState = ref(ad4mConnect.authState);

function gotNewMessage(p: PerspectiveProxy, link: LinkExpression) {
  const routeChannelId = route.params.channelId;
  const channelId = link.data.source;
  const isCurrentChannel = routeChannelId === channelId;
  if (isCurrentChannel) return;

  // TODO: Update channel to say it has a new message
  const expression = Literal.fromUrl(link.data.target).get();
  const expressionDate = new Date(expression.timestamp);
  let minuteAgo = new Date();
  minuteAgo.setSeconds(minuteAgo.getSeconds() - 30);
  if (expressionDate > minuteAgo) {
    // TODO: Show message notification
  }
}

// Todo: move this initialisation into a composable or higher component?
async function initializeApp() {
  // Add notification callback
  await appStore.ad4mClient.runtime.addNotificationTriggeredCallback((notification: any) => {
    console.log("notification", notification);
    return null;
  });

  // Register notification
  registerNotification();

  // Ensure LLM tasks are set up
  ensureLLMTasks(appStore.ad4mClient.ai);

  // Reload page if auth state changes
  ad4mConnect.addEventListener("authstatechange", async () => {
    let oldState = oldAuthState.value;
    oldAuthState.value = ad4mConnect.authState;
    if (ad4mConnect.authState === "authenticated" && oldState !== "authenticated") {
      window.location.reload();
    }
  });

  // Listen for new messages
  onLinkAdded((p: PerspectiveProxy, link: LinkExpression) => {
    if (link.data.predicate === EntryType.Message) gotNewMessage(p, link);
  });

  // Todo: Version checking for ad4m / flux compatibility
  const { ad4mExecutorVersion } = await appStore.ad4mClient.runtime.info();
  const isIncompatible = semver.gt(dependencies["@coasys/ad4m"], ad4mExecutorVersion);
  if (isIncompatible) {
    // this.$router.push({ name: "update-ad4m" });
  }

  appStore.getMyCommunities();
}

onMounted(async () => initializeApp());
</script>
