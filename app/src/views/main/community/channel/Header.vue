<template>
  <div class="header" v-if="channel" :style="{ minHeight: `${headerHeight}px` }">
    <div class="header-info" :style="{ height: `${headerHeight}px` }">
      <button v-if="isMobile" class="open-sidebar-button" @click="() => uiStore.setCommunitySidebarOpen(true)">
        <ChevronLeftIcon />
      </button>
      <j-flex
        a="center"
        @click="() => changeCurrentView(`conversation${channel?.isConversation ? '' : 's'}`)"
        style="cursor: pointer"
      >
        <j-icon
          :name="channel.isConversation ? 'flower2' : 'hash'"
          size="md"
          color="ui-300"
          :style="{ marginRight: channel.isConversation ? '10px' : '5px' }"
        />
        <j-text
          color="black"
          weight="700"
          size="500"
          nomargin
          :tag="conversation && !conversation.nameFixed ? 'i' : 'span'"
        >
          {{ channel.isConversation ? conversation?.conversationName || '' : channel.name }}
        </j-text>
      </j-flex>

      <button class="header-button highlighted" @click="editChannelName">
        <j-icon name="pencil-square" size="sm" />
      </button>
    </div>

    <div class="header-buttons" :style="{ height: `${headerHeight}px` }">
      <template v-if="!callWindowOpen && (!inCall || callRoute.channelId === channelId)">
        <j-button size="sm" variant="primary" :onClick="() => uiStore.setCallWindowOpen(true)">
          <j-icon size="sm" name="telephone" style="margin-right: -5px" />
          {{ `${inCall ? 'Open call window' : agentsInCall.length ? 'Join call' : 'Start call'}` }}
        </j-button>

        <AvatarGroup
          v-if="agentsInCall.length"
          @click="() => uiStore.setCallWindowOpen(true)"
          :users="agentsInCall"
          :tooltip-title="`${agentsInCall.length} agent${agentsInCall.length > 1 ? 's' : ''} in the call`"
          size="xs"
        />
      </template>

      <button
        v-if="channel.isConversation"
        class="header-button"
        :class="channel.isPinned ? 'highlighted' : ''"
        @click="togglePinned"
      >
        <j-icon name="pin" size="sm" style="margin: 3px 7px 0 0" />
        {{ channel.isPinned ? 'Pinned' : 'Pin' }}
      </button>
    </div>

    <div class="header-views" :style="{ height: `${headerHeight}px` }">
      <label
        v-for="view in views"
        :class="{ tab: true, checked: view.pkg === viewId }"
        @click="() => changeCurrentView(view.pkg)"
      >
        <j-icon :name="view.icon" size="xs" />
        <span>{{ view.name }}</span>
      </label>

      <j-tooltip placement="auto" title="Manage plugins">
        <j-button v-if="sameAgent" @click="manageChannelPlugins" size="sm" variant="ghost">
          <j-icon size="md" name="plus" />
        </j-button>
      </j-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import AvatarGroup from '@/components/avatar-group/AvatarGroup.vue';
import { ChevronLeftIcon } from '@/components/icons';
import { useCommunityService } from '@/composables/useCommunityService';
import { useRouteParams } from '@/composables/useRouteParams';
import { useAppStore, useModalStore, useUiStore, useWebrtcStore } from '@/stores';
import { stripChannelPrefix } from '@/utils/routeUtils';
import { App, Channel, ChannelSummary } from '@coasys/flux-api';
import { useLiveQuery } from '@coasys/ad4m-vue-hooks';
import { fluxDebug, fluxDebugWarn } from '@coasys/flux-utils';
import { storeToRefs } from 'pinia';
import { computed, onActivated, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({ name: 'Header' });

const router = useRouter();
const appStore = useAppStore();
const modalStore = useModalStore();
const uiStore = useUiStore();
const webrtcStore = useWebrtcStore();

const { me } = storeToRefs(appStore);
const { isMobile, callWindowOpen, headerHeight } = storeToRefs(uiStore);
const { inCall, callRoute } = storeToRefs(webrtcStore);

const {
  perspective,
  signallingService,
  allChannels,
  recentConversationsWithAgents: recentConversations,
} = useCommunityService();
const { communityId, channelId, viewId } = useRouteParams();

const channel = computed(() => allChannels.value.find((c) => stripChannelPrefix(c.id) === channelId.value));
const conversation = computed(() =>
  channel.value?.isConversation
    ? recentConversations.value.find((c) => c.channel?.id && stripChannelPrefix(c.channel.id) === channelId.value)
        ?.conversation
    : null,
);
const sameAgent = computed(() => channel.value?.author === me.value.did);
const agentsInCall = computed(() => signallingService?.getAgentsInCall(channelId.value)?.value || []);

const { data: views } = useLiveQuery(App, perspective, {
  parent: { model: Channel, id: channel.value?.id ?? '' },
});

// Debug: trace every state transition on the channel-view (plugin tabs) query.
// Symptom we're chasing: on the AD4M typed-RDF-literals branch, the plugin
// tabs disappear silently — the header renders no <label class="tab"> entries
// because `views` is empty, and there is no error surfaced to the user. This
// lets us see whether App.parent=Channel resolution is returning [] and why.
watch(
  [() => channel.value?.id, () => views.value?.length ?? -1],
  ([channelId, count]) => {
    fluxDebug('ChannelHeader.plugins', 'query.state', {
      channelId,
      perspectiveUuid: perspective.value?.uuid,
      viewCount: count,
      firstViewPkg: views.value?.[0]?.pkg,
      firstViewName: views.value?.[0]?.name,
    });
    if (channelId && count === 0) {
      fluxDebugWarn('ChannelHeader.plugins', 'query.empty', {
        channelId,
        hint: 'useLiveQuery(App, parent=Channel) returned no plugin views — check that App @Property/@HasMany resolves through the has_child predicate and the SDNA subject class is loaded.',
      });
    }
  },
  { immediate: true },
);

function manageChannelPlugins() {
  modalStore.showManageChannelPluginsModal = true;
}

function editChannelName() {
  modalStore.showEditChannelNameModal = true;
}

function changeCurrentView(viewId: string) {
  router.push({ name: 'view', params: { communityId: communityId.value, channelId: channelId.value, viewId } });
}

async function togglePinned() {
  if (!channel.value) return;

  try {
    const channelModel = await ChannelSummary.findOne(perspective, { where: { id: channel.value.id } });
    if (!channelModel) return;
    channelModel.isPinned = !channel.value.isPinned;
    await channelModel.save();
  } catch (error) {
    console.error('Error toggling pinned state:', error);
    appStore.showDangerToast({ message: 'Failed to update pinned state' });
  }
}

// Automatically open call window if there are agents in call but window is closed
function checkAndOpenCallWindow() {
  setTimeout(() => {
    if (agentsInCall.value.length > 0 && !inCall.value && !callWindowOpen.value) {
      uiStore.setCallWindowOpen(true);
    }
  }, 1000);
}

// Check on mount and activation (switching back to this view)
onMounted(checkAndOpenCallWindow);
onActivated(checkAndOpenCallWindow);
</script>

<style scoped lang="scss">
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0 var(--j-space-400);
  background: var(--app-channel-header-bg-color, transparent);
  border-bottom: 1px solid var(--app-channel-header-border-color, var(--j-border-color));

  .open-sidebar-button {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--j-color-ui-300);
    font-weight: 600;
    font-size: var(--j-font-size-400);

    > svg {
      width: 20px;
      height: 20px;
    }
  }

  .header-info,
  .header-buttons,
  .header-views {
    display: flex;
    align-items: center;
    gap: var(--j-space-400);
    margin-right: var(--j-space-600);
  }

  .header-views {
    gap: var(--j-space-600);
    overflow-x: auto;
  }

  .header-button {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--j-color-ui-500);
    font-size: var(--j-font-size-400);
    padding: 0 var(--j-space-300);
    border-radius: 8px;
    background: var(--j-color-ui-100);
    height: var(--j-size-sm);

    > j-icon {
      color: var(--j-color-ui-400);
    }

    &.highlighted {
      outline: 1px solid var(--j-color-primary-500);
      color: var(--j-color-primary-600);

      > j-icon {
        color: var(--j-color-primary-600);
      }
    }

    &:hover {
      color: var(--j-color-ui-600);

      > j-icon {
        color: var(--j-color-ui-500);
      }

      &.highlighted {
        outline: 1px solid var(--j-color-primary-600);
        color: var(--j-color-primary-700);

        > j-icon {
          color: var(--j-color-primary-700);
        }
      }
    }
  }
}

.tab {
  height: 100%;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  color: var(--j-color-ui-500);
  font-size: var(--j-font-size-500);
  cursor: pointer;
  position: relative;
  padding: var(--j-space-200) 0;
  border-bottom: 1px solid transparent;

  &:hover {
    color: var(--j-color-black);
  }

  &.checked {
    position: relative;
    border-bottom: 1px solid var(--j-color-primary-500);
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
