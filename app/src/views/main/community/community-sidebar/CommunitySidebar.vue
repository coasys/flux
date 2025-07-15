<template>
  <Header />
  <Members />
  <j-box mt="800" pl="500">
    <j-button @click="startConversation" variant="primary" :loading="newConversationLoading">
      <!-- <j-icon name="flower2" /> -->
      <j-icon name="door-open" />
      Start conversation
    </j-button>
  </j-box>
  <PinnedConversations v-if="pinnedConversations.length" />
  <RecentConversations />
  <ChannelList />
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { App, Channel, Conversation, getAllFluxApps } from "@coasys/flux-api";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ChannelList from "./ChannelList.vue";
import Header from "./Header.vue";
import Members from "./Members.vue";
import PinnedConversations from "./PinnedConversations.vue";
import RecentConversations from "./RecentConversations.vue";

defineOptions({ name: "CommunitySidebar" });

const route = useRoute();
const router = useRouter();
const { perspective, pinnedConversations } = useCommunityService();

const newConversationLoading = ref(false);

// TODO: handle parent links when conversation created in channels
async function startConversation() {
  newConversationLoading.value = true;

  // Create the channel
  const channel = new Channel(perspective);
  channel.name = "";
  channel.description = "";
  channel.isConversation = true;
  channel.isPinned = false;
  await channel.save();

  // Create the first placeholder conversation
  const conversation = new Conversation(perspective, undefined, channel.baseExpression);
  conversation.conversationName = "New conversation";
  conversation.summary = "Content will appear when the first items have been processed...";
  await conversation.save();

  // Attach the chat app
  const fluxApps = await getAllFluxApps();
  const chatAppData = fluxApps.find((app) => app.pkg === "@coasys/flux-chat-view");

  if (!chatAppData) {
    console.error("Chat app not found in flux apps");
    return;
  }

  const { name, description, icon, pkg } = chatAppData;

  const chatApp = new App(perspective, undefined, channel.baseExpression);
  chatApp.name = name;
  chatApp.description = description;
  chatApp.icon = icon;
  chatApp.pkg = pkg;
  await chatApp.save();

  console.log("chatting app created", chatApp);

  // Navigate to the new channel
  const communityId = route.params.communityId as string;
  router.push({ name: "view", params: { communityId, channelId: channel.baseExpression, viewId: "conversation" } });

  newConversationLoading.value = false;
}
</script>
