<template>
  <chat-view
    ref="chatView"
    :perspective-uuid="channel.neighbourhood.perspective.uuid"
    :members="JSON.stringify(memberMentions)"
    :channels="JSON.stringify(channelMentions)"
  ></chat-view>
  <j-modal
    size="xs"
    v-if="activeProfile"
    :open="showProfile"
    @toggle="(e) => toggleProfile(e)"
  >
    <Profile 
      :did="activeProfile" 
      :langAddress="profileLanguage" 
      @openCompleteProfile="() => handleProfileClick(activeProfile)" 
    />
  </j-modal>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ChannelState, CommunityState, ExpressionAndRef, ExpressionTypes, ProfileExpression, ProfileWithDID } from "@/store/types";
import { useDataStore } from "@/store/data";
import { ad4mClient } from "@/app";
import { getProfile } from "@/utils/profileHelpers";

interface MentionTrigger {
  label: string;
  id: string;
  trigger: string;
}


export default defineComponent({
  name: "ChannelView",
  setup() {
    const dataStore = useDataStore();
    const memberMentions = ref<MentionTrigger[]>([])
    const activeProfile = ref<any>({})
    const showProfile = ref(false)

    return {
      dataStore,
      script: null as HTMLElement | null,
      memberMentions,
      activeProfile,
      showProfile
    };
  },
  async mounted() {
    (this.$refs as any).chatView.addEventListener('memberClick', (e: any) => {
      console.log('evt triggered', e.detail);
      this.toggleProfile(true, e.detail)
    });
    this.script = document.createElement("script");
    this.script.setAttribute("type", "module");
    this.script.innerHTML = `
      import ChatView from 'file:///home/fayeed/dev/perspective-views/packages/mini-chat-view/dist/main.js';
      if(customElements.get('chat-view') === undefined) 
        customElements.define("chat-view", ChatView);
    `;
    this.script;
    document.body.appendChild(this.script);
  },
  unmounted() {
    document.body.removeChild(this.script as any);
  },
  beforeRouteUpdate(to, from, next) {
    const editor = document.getElementsByTagName("footer")[0];
    (editor?.getElementsByTagName('j-flex')[0]?.querySelector("emoji-picker") as any)?.database.close();
    next();
  },
  beforeRouteLeave(to, from, next) {
    const editor = document.getElementsByTagName("footer")[0];
    (editor?.getElementsByTagName('j-flex')[0]?.querySelector("emoji-picker") as any)?.database.close();
    next();
  },
  watch: {
    channel: {
      handler: async function () {
        const profiles = await Promise.all(
          this.community.neighbourhood.members.map(
            async (did: string): Promise<ProfileWithDID | null> => {
              return await getProfile(this.profileLanguage, did)
            }
          )
        );

        console.log('profiles', profiles)

        const filteredProfiles = profiles.filter(
          (profile) => profile !== null
        ) as ProfileWithDID[];

        console.log('profiles', filteredProfiles)

        const mentions = filteredProfiles.map((user: ProfileWithDID) => {
          return {
            label: user.username,
            //todo: this should not be replaced, we want the full did identifier in the mentions in case message is consumed by another application
            id: user.did,
            trigger: "@",
          } as MentionTrigger;
        });

        console.log('profiles', mentions)

        this.memberMentions = mentions;
      },
      immediate: true,
    },
  },
  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.dataStore.getCommunity(communityId as string);
    },
    channel(): ChannelState {
      const { channelId } = this.$route.params;
      return this.dataStore.getChannel(channelId as string);
    },
    channelMentions(): MentionTrigger[] {
      return this.dataStore
        .getChannelNeighbourhoods(this.community.neighbourhood.perspective.uuid)
        .map((channel: any) => {
          if (
            channel.neighbourhoodUrl ===
            this.community.neighbourhood.neighbourhoodUrl
          ) {
            return {
              label: "Home",
              id: channel.neighbourhoodUrl,
              trigger: "#",
            } as MentionTrigger;
          } else {
            return {
              label: channel.name,
              id: channel.neighbourhoodUrl,
              trigger: "#",
            } as MentionTrigger;
          }
        });
    },
    profileLanguage(): string {
      const profileLang =
        this.community.neighbourhood.typedExpressionLanguages.find(
          (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
        );
      return profileLang!.languageAddress;
    },
  },
  methods: {
    toggleProfile(open: boolean, did?: any): void {
      if (!open) {
        this.activeProfile = undefined;
      } else {
        this.activeProfile = did;
      }
      this.showProfile = open;
    },
    async handleProfileClick(did: string) {
      this.activeProfile = did;

      const me = await ad4mClient.agent.me();

      if (did === me.did) {
        this.$router.push({ name: "home", params: { did } });
      } else {
        this.$router.push({ name: "profile", params: { did, communityId: this.community.neighbourhood.perspective.uuid } });
      }
    },
  }
});
</script>
