<template>
  <j-box pt="500" pb="800">
    <j-menu-group open title="Channels">
      <j-button @click.prevent="() => setShowCreateChannel(true)" size="sm" slot="end" variant="ghost">
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>

      <j-box mt="400" ml="600" v-if="channelsLoading">
        <j-spinner size="sm" />
      </j-box>

      <j-popover
        v-else
        v-for="channel in channels"
        :key="channel.baseExpression"
        event="contextmenu"
        placement="bottom-start"
      >
        <div slot="trigger">
          <j-menu-item
            tag="j-menu-item"
            class="channel"
            :class="{ 'channel--muted': channel.notifications?.mute }"
            :selected="channel.baseExpression === activeChannelId && !channel.expanded"
            @click="() => navigateToChannel(channel.baseExpression)"
          >
            <j-icon slot="start" size="xs" :name="getIcon(channel.views[0])" />
            {{ channel.name }}
            <div slot="end" class="channel__notification" v-if="channel.hasNewMessages"></div>
            <div class="active-agents">
              <j-box v-for="(agent, did) in activeAgents[channel.baseExpression]" :key="did">
                <ActiveAgent :key="did" :did="did" v-if="agent" />
              </j-box>
            </div>
          </j-menu-item>
          <div class="channel-views" v-if="channel.expanded">
            <j-menu-item
              :selected="view.type === channel.currentView && channel.baseExpression === $route.params.channelId"
              size="sm"
              v-for="view in getViewOptions(channel.views)"
              @click="() => handleChangeView(channel.baseExpression, view.type)"
            >
              <j-icon size="xs" slot="start" :name="view.icon"></j-icon>
              {{ view.title }}
            </j-menu-item>
          </div>
        </div>
        <j-menu slot="content">
          <j-menu-item
            v-if="isChannelCreator(channel.baseExpression)"
            @click="() => goToEditChannel(channel.baseExpression)"
          >
            <j-icon size="xs" slot="start" name="pencil" />
            Edit Channel
          </j-menu-item>
          <j-menu-item
            v-if="isChannelCreator(channel.baseExpression)"
            @click="() => deleteChannel(channel.baseExpression)"
          >
            <j-icon size="xs" slot="start" name="trash" />
            Delete Channel
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-menu-group>
    <j-menu-item @click="() => setShowCreateChannel(true)" v-if="!channelsLoading">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { viewOptions as channelViewOptions } from "@/constants";
import { useAppStore } from "@/store/app";
import { PerspectiveExpression } from "@coasys/ad4m";
import { Channel } from "@coasys/flux-api";
import { ChannelView } from "@coasys/flux-types";
import { storeToRefs } from "pinia";
import { defineOptions, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ActiveAgent from "./ActiveAgent.vue";

defineOptions({ name: "ChannelList" });

const router = useRouter();
const appStore = useAppStore();
const { me, activeCommunityId, activeChannelId } = storeToRefs(appStore);
const { setShowCreateChannel, setSidebar, setActiveChannelId, setShowEditChannel } = appStore;
const { perspective, neighbourhood, channels, channelsLoading } = useCommunityService();

// Todo: handle signalling via community service

const activeAgents = ref<Record<string, Record<string, boolean>>>({});

function isChannelCreator(channelId: string): boolean {
  const channel = channels.value.find((e) => e.baseExpression === channelId);
  if (channel) return channel.author === me.value.did;
  else throw new Error("Did not find channel");
}

function getIcon(view: ChannelView | string) {
  return channelViewOptions.find((o) => o.pkg === view)?.icon || "hash";
}

function navigateToChannel(channelId: string) {
  setSidebar(false);
  router.push({ name: "channel", params: { communityId: activeCommunityId.value, channelId } });
}

function checkWhoIsHere() {
  if (neighbourhood) {
    neighbourhood.sendBroadcastU({
      links: [{ source: "", predicate: "is-anyone-in-a-channel", target: "" }],
    });
  }
}

function handleBroadcastCb(expression: PerspectiveExpression) {
  const link = expression.data.links[0];
  if (!link) return;

  const { author, data } = link;
  const { predicate, source, target } = data;
  const isMe = author === me.value.did;

  // if (isMe) {
  //   // Handle signals from me
  //   if (predicate === "leave" && me.did) {
  //     activeAgents[source] = { ...activeAgents[source], [me.did]: false };
  //   }

  //   if (predicate === "peer-signal" && me.did) {
  //     activeAgents[source] = { ...activeAgents[source], [me.did]: true };
  //   }
  // } else {
  //   // Handle signals from others
  //   if (predicate === "is-anyone-in-a-channel" && this.activeChannelId) {
  //     neighbourhood.sendBroadcastU({
  //       links: [{ source: this.activeChannelId, predicate: "i-am-in-channel", target: author }],
  //     });
  //   }

  //   if (predicate === "i-am-in-channel" && target === me.did) {
  //     activeAgents[source] = { ...activeAgents[source], [author]: true };
  //   }

  //   if (predicate === "leave") {
  //     activeAgents[source] = { ...activeAgents[source], [author]: false };
  //   }
  // }
}

function handleToggleClick(channelId: string) {
  // TODO: Toggle channel collapse
}

function goToEditChannel(id: string) {
  setActiveChannelId(id);
  setShowEditChannel(true);
}

function handleChangeView(channelId: string, view: ChannelView) {
  // TODO: Set current channel view
  //this.dataStore.setCurrentChannelView({ channelId, view });
  navigateToChannel(channelId);
}

function getViewOptions(views: ChannelView[]) {
  return channelViewOptions.filter((o) => views.includes(o.type));
}

async function deleteChannel(channelId: string) {
  try {
    const channel = new Channel(perspective, channelId);
    await channel.delete();
    router.push({ name: "community", params: { communityId: activeCommunityId.value } });
  } catch (error) {
    console.error("Failed to delete channel:", error);
  }
}

onMounted(() => {
  neighbourhood.addSignalHandler(handleBroadcastCb);
  // polling.value = setInterval(() => checkWhoIsHere(), 5000);
  checkWhoIsHere();
});

onUnmounted(() => {
  // clearInterval(polling);
  neighbourhood.removeSignalHandler(handleBroadcastCb);
});
</script>

<style scoped>
.channel {
  position: relative;
  display: block;
}

.channel--muted {
  opacity: 0.6;
}

.channel-views {
  margin-left: var(--j-space-400);
}

.channel__notification {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--j-color-primary-500);
}

.active-agents {
  display: flex;
  align-items: center;
  position: absolute;
  gap: var(--j-space-100);
  right: var(--j-space-400);
  top: 50%;
  transform: translateY(-50%);
}
</style>
