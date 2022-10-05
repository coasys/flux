<template>
  <div class="channel-view" style="height: 100%">
    <div class="channel-view__header">
      <j-button
        class="channel-view__sidebar-toggle"
        variant="ghost"
        @click="() => toggleSidebar()"
      >
        <j-icon color="ui-800" size="md" name="arrow-left-short" />
      </j-button>
      <j-text color="black" variant="heading-md"># {{ channel.name }}</j-text>
    </div>

    <perspective-view
      class="perspective-view"
      :port="port"
      :channel="channel.id"
      :perspective-uuid="communityId"
      @agent-click="onAgentClick"
      @perspective-click="onPerspectiveClick"
      @hide-notification-indicator="onHideNotificationIndicator"
    ></perspective-view>
    <j-modal
      size="xs"
      v-if="activeProfile"
      :open="showProfile"
      @toggle="(e) => toggleProfile(e.target.open, activeProfile)"
    >
      <Profile
        :did="activeProfile"
        @openCompleteProfile="() => handleProfileClick(activeProfile)"
      />
    </j-modal>
  </div>
</template>

<script lang="ts">
import ChatView from "@junto-foundation/chat-view";
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState } from "@/store/types";
import { useDataStore } from "@/store/data";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import Profile from "@/containers/Profile.vue";
import useEventEmitter from "@/utils/useEventEmitter";
import { useAppStore } from "@/store/app";

interface MentionTrigger {
  label: string;
  id: string;
  trigger: string;
}

export default defineComponent({
  name: "ChannelView",
  props: ["channelId", "communityId"],
  components: {
    Profile,
  },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const memberMentions = ref<MentionTrigger[]>([]);
    const activeProfile = ref<any>({});
    const showProfile = ref(false);
    const bus = useEventEmitter();

    return {
      appStore,
      dataStore,
      script: null as HTMLElement | null,
      memberMentions,
      activeProfile,
      showProfile,
      bus,
    };
  },
  mounted() {
    const pkg =
      /* @ts-ignore */
      import.meta.env.MODE === "development"
        ? "http://localhost:3030/dist/main.js"
        : "https://unpkg.com/@junto-foundation/chat-view/dist/main.js";

    this.script = document.createElement("script");
    this.script.setAttribute("type", "module");
    this.script.innerHTML = `
      import PerspectiveView from '${pkg}';
      if(customElements.get('perspective-view') === undefined)
        customElements.define("perspective-view", PerspectiveView);
    `;
    this.script;
    document.body.appendChild(this.script);
  },
  computed: {
    port(): number {
      // TODO: This needs to be reactive, probaly not now as we using a normal class
      return parseInt(localStorage.getItem("ad4minPort") || "") || 12000;
    },
    community(): CommunityState {
      const communityId = this.communityId;
      return this.dataStore.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const communityId = this.communityId;
      const channelId = this.channelId;
      return this.dataStore.getChannel(
        communityId as string,
        channelId as string
      )!;
    },
  },
  methods: {
    toggleSidebar() {
      this.appStore.toggleSidebar();
    },
    onAgentClick({ detail }: any) {
      this.toggleProfile(true, detail.did);
    },
    onPerspectiveClick({ detail }: any) {
      if (detail.uuid) {
        this.$router.push({
          name: "channel",
          params: {
            channelId: detail.uuid,
            communityId: this.community.neighbourhood.perspective.uuid,
          },
        });
      }
    },
    onHideNotificationIndicator({ detail }: any) {
      const { channelId } = this.$route.params;
      console.log("hide notification indicator", detail);
      if (channelId) {
        this.dataStore.setHasNewMessages({
          communityId: this.community.neighbourhood.perspective.uuid,
          channelId: channelId as string,
          value: false,
        });
      }
    },
    toggleProfile(open: boolean, did?: any): void {
      if (!open) {
        this.activeProfile = undefined;
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
            communityId: this.community.neighbourhood.perspective.uuid,
          },
        });
      }
    },
  },
});
</script>

<style>
.channel-view__header {
  display: flex;
  align-items: center;
  padding: 0 var(--j-space-200);
  position: sticky;
  border-bottom: 1px solid var(--j-color-white);
  height: var(--app-header-height);
}

.perspective-view {
  height: calc(100% - var(--app-header-height));
  display: block;
}

@media (min-width: 800px) {
  .channel-view__sidebar-toggle {
    display: none;
  }
  .channel-view__header {
    padding: 0 var(--j-space-500);
  }
}
</style>
