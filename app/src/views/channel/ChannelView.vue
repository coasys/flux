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

      <div v-if="isMobile" class="channel-view__header-actions">
        <j-box pr="500" @click="onIsChannelChange">
          <j-flex a="center" gap="200">
            <j-icon name="hash" size="md" color="ui-300"></j-icon>
            <j-text color="black" weight="700" size="500" nomargin>
              {{ channel?.name }}
            </j-text>
          </j-flex>
          <j-box pl="600">
            <j-text variant="label" size="200">Change View</j-text>
          </j-box>
        </j-box>
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
      <div class="channel-view__header-actions" v-if="!isMobile">
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
            <label
              :class="{
                'channel-view-tab': true,
                checked: app.pkg === currentView,
              }"
              v-for="app in apps"
            >
              <input
                :name="channel?.id"
                type="radio"
                :value.prop="app.pkg"
                @change="changeCurrentView"
              />
              <j-icon :name="app.icon" size="xs"></j-icon>
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
      <div v-if="!isMobile" class="channel-view__header-right">
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
      <component
        v-if="wcNames[app.pkg]"
        v-show="
          (currentView === app.pkg && wcNames[app.pkg]) ||
          (webrtcModalOpen && app.pkg === `@coasys/flux-webrtc-view`)
        "
        :is="wcNames[app.pkg]"
        class="perspective-view"
        :class="{
          split: webrtcModalOpen,
          right: webrtcModalOpen && app.pkg === '@coasys/flux-webrtc-view',
        }"
        :source="channelId"
        :agent="agentClient"
        :perspective="data.perspective"
        :currentView="currentView"
        :setModalOpen="() => (webrtcModalOpen = false)"
        @click="onViewClick"
        @hide-notification-indicator="onHideNotificationIndicator"
      />
      <j-box pt="1000" v-show="currentView === app.pkg" v-else>
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
    <j-modal size="xs" v-if="isChangeChannel" :open="isChangeChannel">
      <j-box pt="600" pb="800" px="400">
        <j-box pb="300">
          <j-text variant="heading-sm">Select a channel</j-text>
        </j-box>
        <label
          :class="{
            'channel-view-tab-2': true,
            checked: app.pkg === currentView,
          }"
          v-for="app in apps"
          @click="changeCurrentView"
        >
          <input
            :name="channel?.id"
            type="radio"
            :checked.prop="app.pkg === currentView"
            :value.prop="app.pkg"
          />
          <j-icon :name="app.icon" size="xs"></j-icon>
          <span>{{ app.name }}</span>
        </label>
      </j-box>
    </j-modal>
  </div>
</template>

<script lang="ts">
import Hourglass from "@/components/hourglass/Hourglass.vue";
import Profile from "@/containers/Profile.vue";
import { useAppStore } from "@/store/app";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { Ad4mClient } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import {
  useMe,
  usePerspective,
  usePerspectives,
  useSubject,
  useSubjects,
} from "@coasys/ad4m-vue-hooks";
import {
  App,
  Channel,
  Community,
  generateWCName,
  joinCommunity,
} from "@coasys/flux-api";
import { ChannelView } from "@coasys/flux-types";
import { profileFormatter } from "@coasys/flux-utils";
import { defineComponent, ref } from "vue";

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

    const { entry: community } = useSubject({
      perspective: () => data.value.perspective,
      subject: Community,
    });

    const { entry: channel, repo: channelRepo } = useSubject({
      perspective: () => data.value.perspective,
      id: () => props.channelId,
      subject: Channel,
    });

    const { entries: apps } = useSubjects({
      perspective: () => data.value.perspective,
      source: () => props.channelId,
      subject: App,
    });

    const { me } = useMe(client.agent, profileFormatter);

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
      currentView: ref(""),
      webrtcModalOpen: ref(false),
      allDefined: ref(false),
      ChannelView: ChannelView,
      showEditChannel: ref(false),
      appStore: useAppStore(),
      script: null as HTMLElement | null,
      memberMentions: ref<MentionTrigger[]>([]),
      activeProfile: ref<string>(""),
      showProfile: ref(false),
      isJoiningCommunity: ref(false),
      isExpanded: ref(false),
      isChangeChannel: ref(false),
    };
  },
  computed: {
    sameAgent() {
      return this.channel?.author === this.agent?.did;
    },
    isMobile() {
      return window.innerWidth <= 768;
    },
  },
  watch: {
    apps: {
      handler: function (val) {
        if (!this.currentView) {
          this.currentView = val[0]?.pkg;
        }

        console.log(JSON.stringify(val));

        // Add new views
        val?.forEach(async (app: App) => {
          const wcName = await generateWCName(app.pkg);

          if (!customElements.get(wcName)) {
            const module = await fetchFluxApp(app.pkg);
            if (module?.default) {
              await customElements.define(wcName, module.default);
              console.log("fetched the new app");

              this.wcNames[app.pkg] = wcName;
            }
          } else {
            console.log("this should update", app.pkg, wcName, this.wcNames);
            this.wcNames[app.pkg] = wcName;
          }
        });
      },
      deep: true,
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
      // if entering webrtc view close modal
      if (value === "@coasys/flux-webrtc-view") this.webrtcModalOpen = false;
      else if (
        // if leaving webrtc view (& not small screen) open modal
        this.currentView === "@coasys/flux-webrtc-view" &&
        window.innerWidth > 900
      )
        this.webrtcModalOpen = true;
      this.currentView = value;
      this.isChangeChannel = false;
    },
    toggleSidebar() {
      this.appStore.toggleSidebar();
    },
    onAgentClick(did: string) {
      this.toggleProfile(true, did);
    },
    onIsChannelChange() {
      this.isChangeChannel = !this.isChangeChannel;
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
  position: relative;
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
  position: relative;
  height: calc(100% - var(--app-header-height));
  overflow-y: auto;
  display: block;
}

.split {
  width: 50%;
}

.right {
  position: absolute;
  top: var(--app-header-height);
  right: 0;
  padding: var(--j-space-600);
  width: 50%;
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

.channel-view-tab-2 {
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
}

.channel-view-tab:hover {
  color: var(--j-color-black);
}

.channel-view-tab-2:hover {
  color: var(--j-color-black);
}

.channel-view-tab.checked {
  position: relative;
  border-bottom: 1px solid var(--j-color-primary-500);
  color: var(--j-color-black);
}

.channel-view-tab-2.checked {
  position: relative;
  background: var(--j-color-primary-100);
  color: var(--j-color-black);
}

.channel-view-tab input {
  position: absolute;
  clip: rect(1px 1px 1px 1px);
  clip: rect(1px, 1px, 1px, 1px);
  vertical-align: middle;
}

.channel-view-tab-2 input {
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
