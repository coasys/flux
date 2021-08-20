<template>
  <j-popover
    :open="showCommunityMenu"
    @toggle="(e) => (showCommunityMenu = e.target.open)"
    class="community-sidebar__header"
    event="click"
    placement="bottom-start"
  >
    <button slot="trigger" class="community-sidebar__header-button">
      <j-avatar
        style="--j-avatar-size: 30px"
        :src="community.neighbourhood.image"
        :initials="community.neighbourhood.name.charAt(0)"
      />
      <div class="community-info">
        {{ community.neighbourhood.name }}
      </div>
      <j-icon size="xs" name="chevron-down"></j-icon>
    </button>
    <j-menu slot="content">
      <j-menu-item @click="() => setShowEditCommunity(true)">
        <j-icon size="xs" slot="start" name="pencil" />
        Edit community
      </j-menu-item>
      <j-menu-item @click="() => setShowCommunitySettings(true)">
        <j-icon size="xs" slot="start" name="gear" />
        Settings
      </j-menu-item>
      <j-menu-item @click="() => setShowInviteCode(true)">
        <j-icon size="xs" slot="start" name="person-plus" />
        Invite people
      </j-menu-item>
      <j-divider />
      <j-menu-item @click="() => setShowCreateChannel(true)">
        <j-icon size="xs" slot="start" name="plus" />
        Create channel
      </j-menu-item>
    </j-menu>
  </j-popover>

  <j-box pt="500">
    <j-menu-group-item
      open
      :title="`Members (${community.neighbourhood.members.length})`"
    >
      <j-button
        @click.prevent="() => setShowInviteCode(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <j-box px="500">
        <avatar-group
          @click="() => setShowCommunityMembers(true)"
          :users="community.neighbourhood.members"
        />
      </j-box>
    </j-menu-group-item>
  </j-box>

  <j-box pt="500">
    <j-menu-group-item open title="Channels">
      <j-button
        @click.prevent="() => setShowCreateChannel(true)"
        size="sm"
        slot="end"
        variant="ghost"
      >
        <j-icon size="sm" square name="plus"></j-icon>
      </j-button>
      <router-link
        :to="{
          name: 'channel',
          params: {
            communityId: community.neighbourhood.perspective.uuid,
            channelId: channel.neighbourhood.perspective.uuid,
          },
        }"
        custom
        v-slot="{ navigate, isExactActive }"
        v-for="channel in channels"
        :key="channel.neighbourhood.perspective.uuid"
      >
        <j-popover
          class="community-sidebar__header-menu"
          event="contextmenu"
          placement="bottom-start"
        >
          <j-menu-item
            slot="trigger"
            :id="getValidId(channel.neighbourhood.perspective.uuid)"
            class="channel"
            :class="{ 'channel--mute': channel?.state.notifications?.mute }"
            :selected="isExactActive"
            @click="navigate"
          >
            <j-icon slot="start" size="sm" name="hash"></j-icon>
            {{ channel.neighbourhood.name }}
            <j-icon
              size="xs"
              slot="end"
              v-if="channel?.state.notifications?.mute"
              name="volume-mute"
            />
            <div
              slot="end"
              class="channel__notification"
              v-if="channel.state.hasNewMessages"
            ></div>
          </j-menu-item>
          <j-menu slot="content">
            <j-menu-item
              @click="
                () =>
                  setChannelNotificationState({
                    communityId: community.neighbourhood.perspective.uuid,
                    channelId: channel.neighbourhood.perspective.uuid,
                  })
              "
            >
              <j-icon
                size="xs"
                slot="start"
                :name="
                  channel?.state.notifications?.mute
                    ? 'volume-mute'
                    : 'volume-up'
                "
              />
              {{
                `${
                  channel?.state.notifications?.mute ? "Unmute" : "Mute"
                } Channel`
              }}
            </j-menu-item>
          </j-menu>
        </j-popover>
      </router-link>
      <j-menu-item @click="() => setShowCreateChannel(true)">
        <j-icon size="xs" slot="start" name="plus" />
        Add channel
      </j-menu-item>
    </j-menu-group-item>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { ChannelState } from "@/store/types";
import { mapActions, mapState } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";

export default defineComponent({
  components: { AvatarGroup },
  props: ["community"],
  data: function () {
    return {
      showCommunityMenu: false,
    };
  },
  computed: {
    channels(): ChannelState[] {
      const communityId = this.$route.params.communityId as string;
      return this.getChannelStates()(communityId);
    },
  },
  methods: {
    ...mapActions(useDataStore, ["setChannelNotificationState"]),
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, [
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
    ]),
    getValidId(val: string) {
      return "channel-" + val;
    },
  },
});
</script>

<style lang="scss" scoped>
.community-sidebar__header {
  z-index: 1;
  background: var(--app-drawer-bg-color);
  display: block;
  position: sticky;
  top: 0;
  left: 0;
}

.community-sidebar__header-button {
  color: inherit;
  width: 100%;
  height: 74px;
  display: flex;
  align-items: center;
  gap: var(--j-space-400);
  border: 0;
  outline: 0;
  font-family: inherit;
  text-align: left;
  background: none;
  cursor: pointer;
  padding: 0 var(--j-space-500);
  border-bottom: 1px solid var(--app-drawer-border-color);
}

.community-sidebar__header:hover {
  background: rgba(128, 128, 128, 0.05);
}

.community-info {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 500;
  color: var(--j-color-ui-800);
  font-size: var(--j-font-size-500);
  text-overflow: ellipsis;
}

j-divider {
  display: block;
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-100);
  margin-top: var(--j-space-300);
  margin-bottom: var(--j-space-300);
}

.channel {
  position: relative;
  display: block;
}

.channel--mute {
  opacity: 0.5;
}

.channel__notification {
  position: absolute;
  right: var(--j-space-300);
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--j-color-primary-500);
}
</style>
