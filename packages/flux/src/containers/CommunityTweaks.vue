<template>
  <j-box p="800">
        <j-box pl="500" pb="800">
            <j-text variant="heading-sm">Community Tweaks</j-text>
        </j-box>
        <j-box pl="500" pb="800">
            <j-text variant="subheading" size="300">Rules for popular message</j-text>
        </j-box>
        
        <div class="settings">
            <aside class="settings__sidebar">
                <j-icon size="sm" name="magic" slot="start" />
                Rules
            </aside>
        <div class="settings__content">
            <j-box pb="500">
                <j-input label = "Trigger Emoji" :value="emoji" disabled=true @click="emojiPicker = !emojiPicker"></j-input>
                <emoji-picker
                  v-if="emojiPicker"
                  @emojiClick="onEmojiClick"
                />
            </j-box>
            <j-box pb="500">
                <j-input label = "Number of Emojis" type="number" :value="emojiCount" @input="(e) => (emojiCount = e.target.value)"></j-input>
            </j-box>
            <j-box pb="500">
                <j-button @click="updateSDNA">Update</j-button>
            </j-box>
        </div>
        </div>
    </j-box>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { LocalCommunityState } from "@/store/types";
import { LinkQuery, Literal } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { ZOME, SELF } from "utils/constants/communityPredicates";
import { defineComponent, ref } from "vue";
import { mapActions } from "pinia";
import ThemeEditor from "./ThemeEditor.vue";

export default defineComponent({
  components: { ThemeEditor },
  setup() {
    const appStore = useAppStore();
    const dataStore = useDataStore();
    const emoji = ref("");
    const emojiCount = ref(0);
    const emojiPicker = ref(false);

    return {
      appStore,
      dataStore,
      emoji,
      emojiCount,
      emojiPicker
    };
  },
  data() {
    return {
    };
  },
  async mounted() {
    const perspectiveUuid = this.community.perspectiveUuid;
    const sdnaLinks = await this.getSDNALinks(perspectiveUuid);
    if (sdnaLinks.length > 0) {
      const sdna = Literal.fromUrl(sdnaLinks[0].data.target).get();
      console.log("Loaded existing SDNA: ", sdna);

      const emojiRegex = new RegExp('emoji:\/\/[A-Za-z0-9]+');
      const emojiCountRegex = new RegExp('[a-zA-Z]+ >= ([0-9])');
      const emoji = sdna.match(emojiRegex)[0].replace("emoji://", "");
      this.emoji = String.fromCodePoint(parseInt(`0x${emoji}`));
      this.emojiCount = sdna.match(emojiCountRegex)[1];
      console.log("Found emoji in sdna", this.emoji, this.emojiCount);
    }
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCommunityTweaks"
    ]),
    async onEmojiClick(emoji) {
      console.log("got emoji click", emoji.detail.unicode);
      this.emoji = emoji.detail.unicode;
      this.emojiPicker = false;
    },
    async getSDNALinks(perspectiveUuid) {
        const ad4mClient = await getAd4mClient();
        return await ad4mClient.perspective.queryLinks(perspectiveUuid, {source: SELF, predicate: ZOME} as LinkQuery);
    },
    async updateSDNA() {
        const ad4mClient = await getAd4mClient();
        const perspectiveUuid = this.community.perspectiveUuid;
        console.log("Updating SDNA", this.emoji, this.emojiCount, perspectiveUuid);

        const existingSDNALinks = await this.getSDNALinks(perspectiveUuid);

        for (const link of existingSDNALinks) {
            console.log(link.data.target);
            if (link.data.target.includes("flux_message")) {
                await ad4mClient.perspective.removeLink(perspectiveUuid, link);
            }
        }

        const parsedEmoji = this.emoji.codePointAt(0).toString(16);
        const newSDNA = Literal.from(`emojiCount(Message, Count):- 
      aggregate_all(count, link(Message, "flux://has_reaction", "emoji://1f44d", _, _), Count).

      isPopular(Message) :- emojiCount(Message, Count), Count >= 3.
      isNotPopular(Message) :- emojiCount(Message, Count), Count < 3.

      flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages):-
      link(Channel, "temp://directly_succeeded_by", Message, Timestamp, Author),
      findall((EditMessage, EditMessageTimestamp, EditMessageAuthor), link(Message, "temp://edited_to", EditMessage, EditMessageTimestamp, EditMessageAuthor), EditMessages),
      findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "flux://has_reaction", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
      findall((IsHidden, IsHiddenTimestamp, IsHiddenAuthor), link(Message, "flux://is_card_hidden", IsHidden, IsHiddenTimestamp, IsHiddenAuthor), AllCardHidden),
      findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "flux://has_reply", Message, ReplyTimestamp, ReplyAuthor), Replies).
      
      flux_message_query_popular(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, true):- 
      flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isPopular(Message).
      
      flux_message_query_popular(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, false):- 
      flux_message(Channel, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isNotPopular(Message).`);
        await ad4mClient.perspective.addLink(
            perspectiveUuid,
            {
                source: SELF,
                predicate: ZOME,
                target: newSDNA.toUrl(),
            }
        );

        this.setShowCommunityTweaks(false);
    }
  },
  computed: {
    community(): LocalCommunityState {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getCommunityState(id);
    },
  },
});
</script>

<style scoped>
.settings {
  display: grid;
  gap: var(--j-space-500);
  grid-template-columns: 1fr 4fr;
  overflow-y: auto;
}

.settings__sidebar {
  position: sticky;
  top: 0;
  left: 0;
}

.color-button {
  --hue: 0;
  --saturation: 80%;
  width: var(--j-size-md);
  height: var(--j-size-md);
  background-color: hsl(var(--hue), var(--saturation), 60%);
  border: 2px solid transparent;
  outline: 0;
  border-radius: var(--j-border-radius);
  margin-right: var(--j-space-100);
}
.color-button--active {
  border-color: var(--j-color-primary-600);
}
.colors {
  max-width: 400px;
}
</style>
