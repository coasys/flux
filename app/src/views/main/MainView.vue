<template>
  <AppLayout>
    <!-- Outer left sidebar -->
    <template v-slot:sidebar>
      <MainSidebar />
    </template>

    <!-- Main content -->
    <RouterView v-slot="{ Component }">
      <KeepAlive :include="['CommunityView']" :max="5">
        <component :is="Component" :key="route.params.communityId" />
      </KeepAlive>
    </RouterView>

    <!-- All Modals -->
    <j-modal size="sm" :open="modals.showCreateCommunity" @toggle="(e: any) => setShowCreateCommunity(e.target.open)">
      <CreateCommunity
        v-if="modals.showCreateCommunity"
        @submit="() => setShowCreateCommunity(false)"
        @cancel="() => setShowCreateCommunity(false)"
      />
    </j-modal>

    <j-modal :open="modals.showCreateChannel" @toggle="(e: any) => setShowCreateChannel(e.target.open)">
      <CreateChannel
        v-if="modals.showCreateChannel"
        @submit="() => setShowCreateChannel(false)"
        @cancel="() => setShowCreateChannel(false)"
      />
    </j-modal>

    <!-- <j-modal size="sm" :open="modals.showCommunityMembers" @toggle="(e: any) => setShowCommunityMembers(e.target.open)">
      <CommunityMembers @close="() => setShowCommunityMembers(false)" v-if="modals.showCommunityMembers" />
    </j-modal> -->

    <j-modal size="sm" :open="modals.showEditCommunity" @toggle="(e: any) => setShowEditCommunity(e.target.open)">
      <EditCommunity
        :communityId="activeCommunityId"
        v-if="modals.showEditCommunity"
        @submit="() => setShowEditCommunity(false)"
        @cancel="() => setShowEditCommunity(false)"
      />
    </j-modal>

    <j-modal size="sm" :open="modals.showInviteCode" @toggle="(e: any) => setShowInviteCode(e.target.open)">
      <j-box p="800">
        <j-box pb="500">
          <j-text variant="heading">Invite people</j-text>
          <j-text variant="body">Copy and send this code to the people you want to join your community</j-text>
        </j-box>

        <j-input @click="(e: any) => e.target.select()" size="lg" readonly :value="activeCommunity?.sharedUrl || ''">
          <j-button @click.stop="getInviteCode" variant="ghost" slot="end">
            <j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'" />
          </j-button>
        </j-input>
      </j-box>
    </j-modal>

    <j-modal
      v-if="modals.showEditChannel && activeChannelId"
      :open="modals.showEditChannel"
      @toggle="(e: any) => setShowEditChannel(e.target.open)"
    >
      <EditChannel
        v-if="modals.showEditChannel"
        @cancel="() => setShowEditChannel(false)"
        @submit="() => setShowEditChannel(false)"
        :channelId="activeChannelId"
      />
    </j-modal>

    <j-modal :open="modals.showCommunitySettings" @toggle="(e: any) => setShowCommunitySettings(e.target.open)">
      <CommunitySettings />
    </j-modal>

    <j-modal
      v-if="modals.showLeaveCommunity && activeCommunity"
      size="sm"
      :open="modals.showLeaveCommunity"
      @toggle="(e: any) => setShowLeaveCommunity(e.target.open)"
    >
      <j-box p="800">
        <j-box pb="900">
          <j-text variant="heading"> Leave community '{{ activeCommunity.name || "Unknown" }}' </j-text>
          <j-text nomargin> Are you sure you want to leave this community? </j-text>
        </j-box>

        <j-flex j="end" gap="300">
          <j-button @click="() => setShowLeaveCommunity(false)" variant="link"> Cancel </j-button>
          <j-button variant="primary" @click="leaveCommunity"> Leave community </j-button>
        </j-flex>
      </j-box>
    </j-modal>

    <j-modal
      v-if="modals.showDisclaimer"
      :open="modals.showDisclaimer"
      @toggle="(e: any) => setShowDisclaimer(e.target.open)"
    >
      <j-box p="800">
        <div v-if="modals.showDisclaimer">
          <j-box pb="500">
            <j-flex gap="400" a="center">
              <j-icon name="exclamation-diamond" size="lg" />
              <j-text nomargin variant="heading">Disclaimer</j-text>
            </j-flex>
          </j-box>

          <j-text variant="ingress">
            This is an early version of Flux. Don't use this for essential communication.
          </j-text>

          <ul>
            <li>You might loose your communities and chat messages</li>
            <li>Messages might not always be delivered reliably</li>
          </ul>
        </div>

        <j-box pt="500" pb="500" v-if="!hasJoinedTestingCommunity">
          <j-flex gap="400" a="center">
            <j-icon name="arrow-down-circle" size="lg" />
            <j-text nomargin variant="heading">Testing Community</j-text>
          </j-flex>

          <br />

          <j-text variant="ingress"> Join the Flux Alpha testing community. </j-text>

          <j-button :loading="isJoining" variant="primary" @click="() => handleJoinTestingCommunity()">
            Join Official Testing Community
          </j-button>
        </j-box>
      </j-box>
    </j-modal>
  </AppLayout>
</template>

<script setup lang="ts">
import { ad4mConnect } from "@/ad4mConnect";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import CommunitySettings from "@/containers/CommunitySettings.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import CreateCommunity from "@/containers/CreateCommunity.vue";
import EditChannel from "@/containers/EditChannel.vue";
import EditCommunity from "@/containers/EditCommunity.vue";
import AppLayout from "@/layout/AppLayout.vue";
import { useAppStore } from "@/store/app";
import { LinkExpression, Literal, PerspectiveProxy } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { usePerspectives } from "@coasys/ad4m-vue-hooks";
import { ensureLLMTasks } from "@coasys/flux-api/src/conversation/LLMutils";
import { EntryType } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import semver from "semver";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { dependencies } from "../../../package.json";
import { registerNotification } from "../../utils/registerMobileNotifications";
import MainSidebar from "./main-sidebar/MainSidebar.vue";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { modals, activeCommunityId, activeChannelId } = storeToRefs(appStore);
const {
  ad4mClient,
  setShowCommunitySettings,
  setShowInviteCode,
  setShowEditChannel,
  setShowCreateCommunity,
  setShowCreateChannel,
  setShowDisclaimer,
  setShowLeaveCommunity,
  setShowEditCommunity,
  joinTestingCommunity,
  showSuccessToast,
} = appStore;
const { perspectives, onLinkAdded } = usePerspectives(ad4mClient);

const activeCommunity = ref<PerspectiveProxy | null>(null);
const oldAuthState = ref(ad4mConnect.authState);
const isJoining = ref(false);
const hasCopied = ref(false);

const hasJoinedTestingCommunity = computed(() => {
  return !!Object.values(perspectives).find((p) => p.sharedUrl === DEFAULT_TESTING_NEIGHBOURHOOD);
});

async function leaveCommunity() {
  const client = await getAd4mClient();
  await router.push({ name: "home" });
  await client.perspective.remove(activeCommunityId.value);
  setShowLeaveCommunity(false);
}

async function handleJoinTestingCommunity() {
  try {
    isJoining.value = true;
    await joinTestingCommunity();
    setShowDisclaimer(false);
  } catch (e) {
    console.log(e);
  } finally {
    isJoining.value = false;
  }
}

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

function getInviteCode() {
  // Get the invite code to join community and copy to clipboard
  const url = activeCommunity.value?.sharedUrl;
  const el = document.createElement("textarea");
  el.value = `Hey! Here is an invite code to join my private community on Flux: ${url}`;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  hasCopied.value = true;

  showSuccessToast({ message: "Your custom invite code is copied to your clipboard!" });
}

// Todo: move this initialisation up to parent App component or app.ts file?
async function initializeApp() {
  // Add notification callback
  await ad4mClient.runtime.addNotificationTriggeredCallback((notification: any) => {
    console.log("notification", notification);
    return null;
  });

  // Register notification
  registerNotification();

  // Ensure LLM tasks are set up
  ensureLLMTasks(ad4mClient.ai);

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
  const { ad4mExecutorVersion } = await ad4mClient.runtime.info();
  const isIncompatible = semver.gt(dependencies["@coasys/ad4m"], ad4mExecutorVersion);
  if (isIncompatible) {
    // this.$router.push({ name: "update-ad4m" });
  }
}

onMounted(async () => initializeApp());

// Update the active community and channel IDs in the app store when the route changes
watch(
  () => route.params,
  async ({ communityId, channelId }) => {
    if (activeCommunityId.value !== communityId) {
      appStore.setActiveCommunityId((communityId as string) || "");
      if (communityId) {
        // Todo: Move all community modals into the Community view so this isn't needed and we avoid conflicts persisting community state
        // Fetch and store the active community model for use in the modals
        activeCommunity.value = (await ad4mClient.perspective.byUUID(communityId as string)) as PerspectiveProxy;
      }
    }
    if (activeChannelId.value !== channelId) appStore.setActiveChannelId((channelId as string) || "");
  },
  { immediate: true, deep: true }
);
</script>
