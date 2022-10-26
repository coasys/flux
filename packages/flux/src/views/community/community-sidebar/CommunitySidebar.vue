<template>
  <div class="community-sidebar__header">
    <j-button
      variant="ghost"
      size="sm"
      @click="() => appStore.toggleMainSidebar()"
    >
      <j-icon
        size="sm"
        :name="appStore.showMainSidebar ? 'arrow-bar-left' : 'arrow-bar-right'"
      ></j-icon>
    </j-button>
    <div class="community-info">
      <j-skeleton
        :style="{ '--j-skeleton-height': '1em', '--j-skeleton-width': '60px' }"
        v-if="notSynced"
      ></j-skeleton>
      {{ community.neighbourhood.name }}
    </div>
    <j-popover
      :open="showCommunityMenu"
      @toggle="(e) => (showCommunityMenu = e.target.open)"
      :class="{ 'is-creator': isCreator }"
      event="click"
      placement="bottom-end"
    >
      <button slot="trigger" class="community-sidebar__header-button">
        <j-icon size="xs" name="three-dots"></j-icon>
      </button>
      <j-menu slot="content">
        <j-menu-item v-if="isCreator" @click="() => setShowEditCommunity(true)">
          <j-icon size="xs" slot="start" name="pencil" />
          Edit community
        </j-menu-item>
        <j-menu-item @click="goToSettings">
          <j-icon size="xs" slot="start" name="gear" />
          Settings
        </j-menu-item>
        <j-menu-item @click="goToTweaks">
          <j-icon size="xs" slot="start" name="wrench" />
          Community Tweaks
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
        <j-menu-item
          @click="
            () =>
              toggleHideMutedChannels({
                communityId: community.neighbourhood.perspective.uuid,
              })
          "
        >
          <j-icon
            size="xs"
            slot="start"
            :name="
              community.state.hideMutedChannels ? 'toggle-on' : 'toggle-off'
            "
          />
          Hide muted channels
        </j-menu-item>
      </j-menu>
    </j-popover>
  </div>

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
            channelId: channel.name,
          },
        }"
        custom
        v-slot="{ navigate, isExactActive }"
        v-for="channel in channels"
        :key="channel.id"
      >
        <j-popover
          class="community-sidebar__header-menu"
          event="contextmenu"
          placement="bottom-start"
        >
          <j-menu-item
            slot="trigger"
            class="channel"
            :class="{ 'channel--muted': channel.notifications?.mute }"
            :selected="isExactActive"
            @click="() => navigateTo(navigate)"
          >
            <j-icon slot="start" size="sm" name="hash"></j-icon>
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
          </j-menu-item>
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
              {{
                `${channel?.notifications?.mute ? "Unmute" : "Mute"} Channel`
              }}
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
      </router-link>
    </j-menu-group-item>
    <j-menu-item @click="() => setShowCreateChannel(true)">
      <j-icon size="xs" slot="start" name="plus" />
      Add channel
    </j-menu-item>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch } from "vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import { Profile } from "utils/types";
import { ChannelState, CommunityState } from "@/store/types";
import { mapActions, mapState } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";
import { DexieIPFS } from "@/utils/storageHelpers";
import { getImage } from "utils/api/getProfile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL, SELF } from "utils/constants/communityPredicates";

export default defineComponent({
  components: { AvatarGroup },
  props: {
    community: {
      type: Object as PropType<CommunityState>,
      required: true,
    },
    notSynced: {
      type: Boolean,
      required: true,
    },
  },
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
    channels(): ChannelState[] {
      const communityId = this.$route.params.communityId as string;

      const channels = this.getChannelStates()(communityId);

      if (this.community.state.hideMutedChannels) {
        return channels.filter((e) => !e.notifications.mute);
      }

      return channels;
    },
    isCreator(): boolean {
      return (
        this.community.neighbourhood.creatorDid ===
        this.userStore.getUser?.agent.did
      );
    },
    userProfile(): Profile | null {
      return this.userStore.profile;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
  },
  async mounted() {
    watch(this.dataStore.neighbourhoods, async () => {
      setTimeout(async () => {
        const communityId = this.$route.params.communityId as string;
        const community = this.dataStore.getCommunity(communityId);
        const dexie = new DexieIPFS(communityId);

        const image = await dexie.get(community.neighbourhood.image!);
        // @ts-ignore
        this.communityImage = image;
      }, 500);
    });
  },
  watch: {
    userProfile: {
      async handler() {
        if (this.userStore.profile?.profilePicture) {
          this.userProfileImage = await getImage(
            this.userStore.profile?.profilePicture
          );
        } else {
          this.userProfileImage = null;
        }
      },
      immediate: true,
    },
    "$route.params.communityId": {
      handler: async function (id: string) {
        if (id) {
          this.communityImage = null;
          setTimeout(async () => {
            const community = this.dataStore.getCommunity(id);
            const dexie = new DexieIPFS(id);

            const image = await dexie.get(community.neighbourhood.image!);
            // @ts-ignore
            this.communityImage = image;
          }, 500);
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions(useDataStore, [
      "setChannelNotificationState",
      "toggleHideMutedChannels",
    ]),
    ...mapState(useDataStore, ["getChannelStates"]),
    ...mapActions(useAppStore, [
      "setSidebar",
      "setShowCreateChannel",
      "setShowEditCommunity",
      "setShowCommunityMembers",
      "setShowInviteCode",
      "setShowCommunitySettings",
      "setShowCommunityTweaks",
    ]),
    navigateTo(navigate: any) {
      this.setSidebar(false);
      navigate();
    },
    goToSettings() {
      this.setShowCommunitySettings(true);
      this.showCommunityMenu = false;
    },
    isChannelCreator(channelId: string): boolean {
      const channel = this.channels.find((e) => e.id === channelId);

      return channel.creatorDid === this.userStore.getUser?.agent.did;
    },
    async deleteChannel(channelId: string) {
      const channel = this.channels.find((e) => e.id === channelId);

      const client = await getAd4mClient();

      await client.perspective.removeLink(channel.sourcePerspective, {
        author: channel.creatorDid,
        data: {
          predicate: CHANNEL,
          target: channel.id,
          source: SELF,
        },
        proof: {
          invalid: false,
          key: "",
          signature: "",
          valid: true,
        },
        timestamp: channel.createdAt,
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
    },
    goToTweaks() {
      this.setShowCommunityTweaks(true);
      this.showCommunityMenu = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.community-sidebar__header {
  border-bottom: 1px solid var(--j-color-white);
  z-index: 1;
  display: flex;
  height: var(--app-header-height);
  align-items: center;
  padding-left: var(--j-space-400);
  position: sticky;
  gap: var(--j-space-300);
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
