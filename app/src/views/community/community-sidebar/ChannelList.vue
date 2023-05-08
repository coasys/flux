<template>
  <j-box pt="500" pb="800">
    <j-menu-group open title="Channels">
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
            :selected="
              channel.id === $route.params.channelId && !channel.expanded
            "
            @click="() => navigateToChannel(channel.id)"
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
              slot="start"
              style="--j-icon-size: 13px"
              v-if="channel.views.length > 1"
              :name="channel.expanded ? 'chevron-down' : 'chevron-right'"
            />
            <j-icon
              slot="start"
              size="xs"
              v-else
              :name="getIcon(channel.views[0])"
            ></j-icon>
          </j-menu-item>
          <div class="channel-views" v-if="channel.expanded">
            <j-menu-item
              :selected="
                view.type === channel.currentView &&
                channel.id === $route.params.channelId
              "
              size="sm"
              v-for="view in getViewOptions(channel.views)"
              @click="() => handleChangeView(channel.id, view.type)"
            >
              <j-icon size="xs" slot="start" :name="view.icon"></j-icon>
              {{ view.title }}
            </j-menu-item>
          </div>
        </div>
        <j-menu slot="content">
          <j-menu-item
            v-if="isChannelCreator(channel.id)"
            @click="() => goToEditChannel(channel.id)"
          >
            <j-icon size="xs" slot="start" name="pencil" />
            Edit Channel
          </j-menu-item>
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
            Delete Channel
          </j-menu-item>
        </j-menu>
      </j-popover>
    </j-menu-group>
    <j-menu-item @click="() => setShowCreateChannel(true)">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ChannelState } from "@/store/types";
import { mapActions, mapState } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { Channel, deleteChannel } from "@fluxapp/api";
import { useEntries, usePerspective, usePerspectives } from "@fluxapp/vue";
import { ChannelView } from "@fluxapp/types";
import { viewOptions as channelViewOptions } from "@/constants";
import { Ad4mClient } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";

export default defineComponent({
  props: {
    community: {
      type: Object,
      required: true,
    },
    perspective: {
      type: Object,
      required: true,
    },
  },
  async setup(props) {
    const route = useRoute();

    const client: Ad4mClient = await getAd4mClient();

    const { data } = usePerspective(client, () => route.params.communityId);

    const { entries: channels, repo: channelRepo } = useEntries({
      perspective: () => data.value.perspective,
      source: () => "ad4m://self",
      model: Channel,
    });

    return {
      channelRepo,
      channels,
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
  methods: {
    ...mapActions(useDataStore, ["setChannelNotificationState"]),
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, ["setSidebar", "setShowCreateChannel"]),
    handleToggleClick(channelId: string) {
      this.dataStore.toggleChannelCollapse(channelId);
    },
    goToEditChannel(id: string) {
      this.appStore.setActiveChannel(id);
      this.appStore.setShowEditChannel(true);
    },
    handleChangeView(channelId: string, view: ChannelView) {
      this.dataStore.setCurrentChannelView({ channelId, view });
      this.navigateToChannel(channelId);
    },
    navigateToChannel(channelName: string) {
      this.setSidebar(false);
      this.$router.push({
        name: "channel",
        params: {
          communityId: this.perspective.uuid,
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
      await this.channelRepo?.remove(channelId);
      this.$router.push({
        name: "community",
        params: {
          communityId: this.perspective.uuid,
        },
      });
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

.channel-views {
  margin-left: var(--j-space-400);
}

.channel__notification {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--j-color-primary-500);
}
</style>
