<template>
  <div style="height: 100%">
    <perspective-view
      :port="port"
      :channel="channel.name"
      :perspective-uuid="channel.sourcePerspective"
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
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState } from "@/store/types";
import { useDataStore } from "@/store/data";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import Profile from "@/containers/Profile.vue";
import useEventEmitter from "@/utils/useEventEmitter";

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
    const dataStore = useDataStore();
    const memberMentions = ref<MentionTrigger[]>([]);
    const activeProfile = ref<any>({});
    const showProfile = ref(false);
    const bus = useEventEmitter();

    return {
      dataStore,
      script: null as HTMLElement | null,
      memberMentions,
      activeProfile,
      showProfile,
      bus,
    };
  },
  async mounted() {
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
  unmounted() {
    document.body.removeChild(this.script as any);
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
      this.dataStore.setHasNewMessages({
        communityId: this.community.neighbourhood.perspective.uuid,
        channelId: channelId as string,
        value: false,
      });
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
