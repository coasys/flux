<template>
  <j-box pt="500" pb="800">
    <j-menu-group-item open title="Channels">
      <j-button
        @click.prevent="() => setShowCreateChannel(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>

      <j-popover
        event="contextmenu"
        placement="bottom-start"
        v-for="channel in channels"
        :key="channel.id"
      >
        <div slot="trigger">
          <j-menu-item
            tag="j-menu-item"
            class="channel"
            :class="{ 'channel--muted': channel.notifications?.mute }"
            :selected="channel.name === $route.params.channelId"
            @click="() => navigateToChannel(channel.name)"
          >
            {{ channel.name }}
            <j-icon
              size="xs"
              slot="end"
              v-if="channel?.notifications?.mute"
              name="bell-slash"
            />
            <div
              slot="end"
              class="channel__notification"
              v-if="channel.hasNewMessages"
            ></div>

            <j-icon
              @click.stop="handleToggleClick(channel.id)"
              slot="end"
              style="--j-icon-size: 13px"
              v-if="channel.views.length > 1"
              :name="channel.collapsed ? 'chevron-down' : 'chevron-right'"
            />
            <j-icon
              slot="end"
              size="xs"
              v-else
              :name="getIcon(channel.views[0])"
            ></j-icon>
          </j-menu-item>
          <div v-if="channel.collapsed">
            <j-menu-item
              size="sm"
              v-for="view in getViewOptions(channel.views)"
              @click="
                () => handleChangeView(channel.id, channel.name, view.type)
              "
            >
              <j-icon
                :color="
                  view.type === channel.currentView &&
                  channel.name === $route.params.channelId
                    ? 'black'
                    : 'ui-500'
                "
                size="xs"
                slot="end"
                :name="view.icon"
              ></j-icon>
              <j-text
                :color="
                  view.type === channel.currentView &&
                  channel.name === $route.params.channelId
                    ? 'black'
                    : 'ui-500'
                "
                nomargin
                >{{ view.title }}
              </j-text>
            </j-menu-item>
          </div>
        </div>
        <j-menu slot="content">
          <j-menu-item
            @click="
              () =>
                setChannelNotificationState({
                  channelId: channel.id,
                })
            "
          >
            <j-icon
              size="xs"
              slot="start"
              :name="channel?.notifications?.mute ? 'bell-slash' : 'bell'"
            />
            {{ `${channel?.notifications?.mute ? "Unmute" : "Mute"} Channel` }}
          </j-menu-item>
          <j-menu-item
            v-if="isChannelCreator(channel.id)"
            @click="() => deleteChannel(channel.id)"
          >
            <j-icon size="xs" slot="start" name="trash" />
            {{ `Delete Channel` }}
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-menu-group-item>
    <j-menu-item @click="() => setShowCreateChannel(true)">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChannelState } from "@/store/types";
import { mapActions, mapState } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { deleteChannel } from "utils/api/deleteChannel";
import { ChannelView } from "utils/types";
import channelViewOptions from "utils/constants/viewOptions";

export default defineComponent({
  setup() {
    return {
      userProfileImage: ref<null | string>(null),
      appStore: useAppStore(),
      userStore: useUserStore(),
      dataStore: useDataStore(),
    };
  },
  data: function () {
    return {
      showCommunityMenu: false,
      communityImage: null,
    };
  },
  computed: {
    community() {
      const communityId = this.$route.params.communityId as string;
      return this.dataStore.getCommunityState(communityId);
    },
    channels(): ChannelState[] {
      const communityId = this.$route.params.communityId as string;
      const channels = this.getChannelStates()(communityId);

      if (this.community.state.hideMutedChannels) {
        return channels.filter((e) => !e.notifications.mute);
      }

      return channels;
    },
  },
  methods: {
    ...mapActions(useDataStore, ["setChannelNotificationState"]),
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, ["setSidebar", "setShowCreateChannel"]),
    navigateTo(navigate: any) {
      this.setSidebar(false);
      navigate();
    },
    handleToggleClick(channelId: string) {
      this.dataStore.toggleChannelCollapse(channelId);
    },
    handleChangeView(
      channelId: string,
      channelName: string,
      view: ChannelView
    ) {
      this.dataStore.setCurrentChannelView({ channelId, view });
      this.navigateToChannel(channelName);
    },
    navigateToChannel(channelName: string) {
      this.$router.push({
        name: "channel",
        params: {
          communityId: this.community.neighbourhood.uuid,
          channelId: channelName,
        },
      });
    },
    isChannelCreator(channelId: string): boolean {
      const channel = this.channels.find((e) => e.id === channelId);

      if (channel) {
        return channel.author === this.userStore.getUser?.agent.did;
      } else {
        throw new Error("Did not find channel");
      }
    },
    getViewOptions(views: ChannelView[]) {
      return channelViewOptions.filter((o) => views.includes(o.type));
    },
    getIcon(view: ChannelView) {
      return channelViewOptions.find((o) => o.type === view)?.icon || "hash";
    },
    async deleteChannel(channelId: string) {
      const channel = this.channels.find((e) => e.id === channelId);

      if (channel) {
        await deleteChannel(channel.sourcePerspective, {
          id: channelId,
          timestamp: channel.timestamp,
          author: channel.author,
        });

        this.dataStore.removeChannel({
          channelId: channel.id,
        });

        const isSameChannel = this.$route.params.channelId === channel.name;

        if (isSameChannel) {
          this.$router.push({
            name: "channel",
            params: {
              communityId: channel.sourcePerspective,
              channelId: "Home",
            },
          });
        }
      } else {
        throw new Error("Did not find channel");
      }
    },
  },
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

.channel__notification {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--j-color-primary-500);
}
</style>
