<template>
  <div
    class="channel-view"
    style="height: 100%"
    :class="{ expanded: isExpanded }"
  >
    <div class="channel-view__header">
      <j-button
        class="channel-view__sidebar-toggle"
        variant="ghost"
        @click="() => toggleSidebar()"
      >
        <j-icon color="ui-800" size="md" name="arrow-left-short" />
      </j-button>

      <div class="channel-view__header-actions">
        <div class="channel-view__header-left">
          <j-box pr="500">
            <j-flex a="center" gap="200">
              <j-icon name="hash" size="md" color="ui-300"></j-icon>
              <j-text color="black" weight="700" size="500" nomargin>
                {{ channel?.name }}
              </j-text>
            </j-flex>
          </j-box>
          <div class="channel-view__tabs">
            <label class="channel-view-tab" v-for="app in apps">
              <input
                :name="channel?.id"
                type="radio"
                :checked.prop="app.pkg === currentView"
                :value.prop="app.pkg"
                @change="changeCurrentView"
              />
              <span>{{ app.name }}</span>
            </label>
            <j-tooltip placement="auto" title="Manage views">
              <j-button
                v-if="sameAgent"
                @click="() => goToEditChannel(channel?.id)"
                size="sm"
                variant="ghost"
              >
                <j-icon size="md" name="plus"></j-icon>
              </j-button>
            </j-tooltip>
          </div>
        </div>
      </div>
      <div class="channel-view__header-right">
        <j-tooltip
          placement="auto"
          :title="isExpanded ? 'Minimize' : 'Fullsize'"
        >
          <j-button size="sm" variant="ghost">
            <j-icon
              size="sm"
              :name="
                isExpanded ? 'arrows-angle-contract' : 'arrows-angle-expand'
              "
              @click="isExpanded = !isExpanded"
            ></j-icon>
          </j-button>
        </j-tooltip>
      </div>
    </div>

    <template v-for="app in apps">
      {{ wcNames }}

      <component
        v-if="wcNames[app.pkg]"
        v-show="currentView === app.pkg && wcNames[app.pkg]"
        :is="wcNames[app.pkg]"
        class="perspective-view"
        :source="channelId"
        :agent.prop="agentClient"
        :perspective.prop="data.perspective"
        @click="onViewClick"
        @hide-notification-indicator="onHideNotificationIndicator"
      />
      <j-box pt="1000" v-show="currentView && currentView === app.pkg" v-else>
        <j-flex direction="column" a="center" j="center" gap="500">
          <j-spinner></j-spinner>
          <span>Loading plugin...</span>
        </j-flex>
      </j-box>
    </template>

    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e: any) => toggleProfile(e.target.open, activeProfile)"
    >
      <Profile
        :did="activeProfile"
        @openCompleteProfile="() => handleProfileClick(activeProfile)"
      />
    </j-modal>
    <j-modal size="xs" v-if="isJoiningCommunity" :open="isJoiningCommunity">
      <j-box p="500" align="center">
        <Hourglass width="30px"></Hourglass>
        <j-text variant="heading">Joining community</j-text>
        <j-text>Please wait...</j-text>
      </j-box>
    </j-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import Profile from "@/containers/Profile.vue";
import { useAppStore } from "@/store/app";
import { ChannelView } from "@fluxapp/types";
import Hourglass from "@/components/hourglass/Hourglass.vue";
import {
  useEntry,
  usePerspective,
  usePerspectives,
  useMe,
  useEntries,
} from "@fluxapp/vue";
import {
  Community,
  Channel,
  App,
  joinCommunity,
  generateWCName,
} from "@fluxapp/api";
import { Ad4mClient } from "@perspect3vism/ad4m";
import fetchFluxApp from "@/utils/fetchFluxApp";

interface MentionTrigger {
  label: string;
  id: string;
  trigger: string;
}

export default defineComponent({
  name: "ChannelView",
  props: {
    communityId: String,
    channelId: String,
  },
  components: {
    Profile,
    Hourglass,
  },
  async setup(props) {
    const client: Ad4mClient = await getAd4mClient();

    const { perspectives } = usePerspectives(client);

    const { data } = usePerspective(client, () => props.communityId);

    const { entry: community } = useEntry({
      perspective: () => data.value.perspective,
      model: Community,
    });

    const { entry: channel, repo: channelRepo } = useEntry({
      perspective: () => data.value.perspective,
      id: () => props.channelId,
      model: Channel,
    });

    const { entries: apps } = useEntries({
      perspective: () => data.value.perspective,
      source: () => props.channelId,
      model: App,
    });

    const { me } = useMe(client.agent);

    return {
      agentClient: client.agent,
      agent: me,
      wcNames: ref<Record<string, string>>({}),
      apps,
      perspectives,
      data,
      community,
      channel,
      channelRepo,
      currentView: "",
      allDefined: ref(false),
      ChannelView: ChannelView,
      selectedViews: ref<ChannelView[]>([]),
      showEditChannel: ref(false),
      appStore: useAppStore(),
      script: null as HTMLElement | null,
      memberMentions: ref<MentionTrigger[]>([]),
      activeProfile: ref<string>(""),
      showProfile: ref(false),
      isJoiningCommunity: ref(false),
      isExpanded: ref(false),
    };
  },
  computed: {
    sameAgent() {
      return this.channel?.author === this.agent?.did;
    },
  },
  watch: {
    apps: {
      handler: function (val) {
        if (!this.currentView) {
          this.currentView = val[0]?.pkg;
        }

        // Add new views
        val?.forEach(async (app: App) => {
          const wcName = await generateWCName(app.pkg);

          if (!customElements.get(wcName)) {
            const module = await fetchFluxApp(app.pkg);
            await customElements.define(wcName, module.default);
            setTimeout(() => {
              this.wcNames[app.pkg] = wcName;
            }, 200);
          } else {
            this.wcNames[app.pkg] = wcName;
          }
        });
      },
      immediate: true,
    },
  },
  methods: {
    async onViewClick(e: any) {
      const parentLink = e.target.closest("a");
      if (parentLink) {
        const url = parentLink.href;

        if (url.startsWith("neighbourhood://")) {
          this.onNeighbourhoodClick(url);
        }

        if (url.startsWith("did:")) {
          this.onAgentClick(url);
        }

        if (url.startsWith("literal://")) {
          const isChannel = this.data.perspective?.isSubjectInstance(
            url,
            Channel
          );
          if (isChannel) {
            this.$router.push({
              name: "channel",
              params: {
                communityId: this.communityId,
                channelId: url,
              },
            });
          }
        }

        if (!url.startsWith("http")) {
          e.preventDefault();
        }
      }
    },

    goToEditChannel(id: string) {
      this.appStore.setActiveChannel(id);
      this.appStore.setShowEditChannel(true);
    },
    changeCurrentView(e: any) {
      const value = e.target.value;
      this.currentView = value;
    },
    toggleSidebar() {
      this.appStore.toggleSidebar();
    },
    onAgentClick(did: string) {
      this.toggleProfile(true, did);
    },
    onChannelClick(channel: string) {
      this.$router.push({
        name: "channel",
        params: {
          channelId: channel,
          communityId: this.$route.params.communityId,
        },
      });
    },
    onNeighbourhoodClick(url: any) {
      let neighbourhood = Object.values(this.perspectives).find(
        (e) => e.sharedUrl === url
      );

      if (!neighbourhood) {
        this.joinCommunity(url);
      } else {
        this.$router.push({
          name: "community",
          params: {
            communityId: neighbourhood.uuid,
          },
        });
      }
    },
    joinCommunity(url: string) {
      this.isJoiningCommunity = true;
      joinCommunity({ joiningLink: url })
        .then((community) => {
          this.$router.push({
            name: "community",
            params: {
              communityId: community.uuid,
            },
          });
        })
        .finally(() => {
          this.isJoiningCommunity = false;
        });
    },
    onHideNotificationIndicator({ detail }: any) {
      const { channelId } = this.$route.params;

      if (channelId) {
        // TODO: Set channel has new messages
        // this.dataStore.setHasNewMessages({
        //   communityId: this.$route.params.communityId as string,
        //   channelId: channelId as string,
        //   value: false,
        // });
      }
    },
    toggleProfile(open: boolean, did?: any): void {
      if (!open) {
        this.activeProfile = "";
      } else {
        this.activeProfile = did;
      }
      this.showProfile = open;
    },
    async handleProfileClick(did: string) {
      const client = await getAd4mClient();
      this.activeProfile = did;

      const me = await client.agent.me();

      if (did === me.did) {
        this.$router.push({ name: "home", params: { did } });
      } else {
        this.$router.push({
          name: "profile",
          params: {
            did,
            communityId: this.$route.params.communityId,
          },
        });
      }
    },
  },
});
</script>

<style>
.expanded {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 999999;
}

.channel-view {
  background: var(--app-channel-bg-color, transparent);
}

.channel-view__header {
  display: flex;
  align-items: center;
  gap: var(--j-space-400);
  padding: 0 var(--j-space-200);
  position: sticky;
  background: var(--app-channel-header-bg-color, transparent);
  border-bottom: 1px solid
    var(--app-channel-header-border-color, var(--j-border-color));
  height: var(--app-header-height);
}

.channel-view__header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  height: 100%;
}

.channel-view__header-left {
  display: flex;
  align-items: center;
  height: 100%;
  gap: var(--j-space-300);
}

.channel-view__header-right {
  align-self: center;
}

.perspective-view {
  height: calc(100% - var(--app-header-height));
  overflow-y: auto;
  display: block;
}

.channel-view__tabs {
  display: flex;
  height: 100%;
  align-items: center;
  gap: var(--j-space-500);
}

.channel-view-tab {
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
}

.channel-view-tab:hover {
  color: var(--j-color-black);
}

.channel-view-tab:has(input:checked) {
  position: relative;
  border-bottom: 1px solid var(--j-color-primary-500);
  color: var(--j-color-black);
}

.channel-view-tab input {
  position: absolute;
  clip: rect(1px 1px 1px 1px);
  clip: rect(1px, 1px, 1px, 1px);
  vertical-align: middle;
}

@media (min-width: 800px) {
  .channel-view__sidebar-toggle {
    display: none;
  }
  .channel-view__header {
    padding: 0 var(--j-space-500);
    justify-content: space-between;
    gap: 0;
  }
}

.perspective-view {
  display: block;
  height: calc(100% - var(--app-header-height));
}
</style>
