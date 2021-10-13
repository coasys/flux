<template>
  <footer class="channel-view__footer">
    <j-editor
      @send="(e) => createDirectMessage(e.target.value)"
      autofocus
      :placeholder="`Write to #${channel.neighbourhood.name}`"
      :value="currentExpressionPost"
      @change="handleEditorChange"
      @onsuggestionlist="changeShowList"
      @editorinit="editorinit"
      :mentions="items"
    ></j-editor>
  </footer>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ExpressionTypes, ProfileWithDID } from "@/store/types";
import { Editor } from "@tiptap/vue-3";
import { useDataStore } from "@/store/data";
import { getProfile } from "@/utils/profileHelpers";
import { ChannelState, CommunityState } from "@/store/types";

interface MentionTrigger {
  name: string;
  id: string;
  trigger: string;
}

export default defineComponent({
  name: "ChannelFooter",
  props: {
    channel: {
      type: Object as PropType<ChannelState>,
      required: true,
    },
    community: {
      type: Object as PropType<CommunityState>,
      required: true,
    },
  },
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      showNewMessagesButton: false,
      noDelayRef: 0,
      currentExpressionPost: "",
      editor: null as Editor | null,
      showList: false,
      showProfile: false,
      activeProfile: {} as any,
      memberMentions: [] as MentionTrigger[],
    };
  },
  watch: {
    channel: {
      handler: async function () {
        const profiles = await Promise.all(
          this.community.neighbourhood.members.map(
            async (did: string): Promise<ProfileWithDID | null> =>
              await getProfile(this.profileLanguage, did)
          )
        );

        const filteredProfiles = profiles.filter(
          (profile) => profile !== null
        ) as ProfileWithDID[];
        console.log(filteredProfiles);

        const mentions = filteredProfiles.map((user: ProfileWithDID) => {
          return {
            name: user.username,
            //todo: this should not be replaced, we want the full did identifier in the mentions in case message is consumed by another application
            id: user.did,
            trigger: "@",
          } as MentionTrigger;
        });

        this.memberMentions = mentions;
      },
      immediate: true,
    },
  },
  computed: {
    channelMentions(): MentionTrigger[] {
      return this.dataStore
        .getChannelNeighbourhoods(this.community.neighbourhood.perspective.uuid)
        .map((channel) => {
          return {
            name: channel.name,
            id: channel.neighbourhoodUrl,
            trigger: "#",
          } as MentionTrigger;
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
    handleEditorChange(e: any) {
      this.currentExpressionPost = e.target.value;
    },
    editorinit(e: any) {
      this.editor = e.detail.editorInstance;
    },
    changeShowList(e: any) {
      this.showList = e.detail.showSuggestions;
    },
    items(trigger: string, query: string) {
      let list = [];

      if (trigger === "@") {
        list = this.memberMentions;
      } else {
        list = this.channelMentions;
      }

      return list
        .filter((item) =>
          item.name.toLowerCase().startsWith(query.toLowerCase())
        )
        .slice(0, 5);
    },
    async createDirectMessage(message: string) {
      const escapedMessage = message.replace(/( |<([^>]+)>)/gi, "");

      this.currentExpressionPost = "";

      if (escapedMessage) {
        this.dataStore.createExpression({
          languageAddress:
            this.channel.neighbourhood.typedExpressionLanguages.find(
              (t: any) => t.expressionType === ExpressionTypes.ShortForm
            )!.languageAddress,
          content: { body: message, background: [""] },
          perspective: this.channel.neighbourhood.perspective.uuid as string,
        });
      }
    },
  },
});
</script>

<style scoped>
.channel-view__footer {
  border-top: 1px solid var(--app-channel-border-color);
  background: var(--app-channel-footer-bg-color);
  padding: var(--j-space-500);
}

j-editor::part(base) {
  border: 0;
}

j-editor::part(toolbar) {
  border: 0;
}
</style>
