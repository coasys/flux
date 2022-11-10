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
                <j-input label = "Number of Emojis" type="number" :value="emojiCount" @input="(e: any) => (emojiCount = e.target.value)"></j-input>
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
import { defineComponent, ref } from "vue";
import { mapActions } from "pinia";
import ThemeEditor from "./ThemeEditor.vue";
import { getSDNAValues } from "utils/api/getSDNA";
import { updateSDNA } from "utils/api/updateSDNA";
import { emoji, emojiCount } from "utils/constants/sdna";

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
    const sdnaValues = await getSDNAValues(perspectiveUuid);
    this.emoji = sdnaValues ? sdnaValues.emoji : emoji;
    this.emojiCount = sdnaValues ? sdnaValues.emojiCount : emojiCount;
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowCommunityTweaks"
    ]),
    //@ts-ignore
    async onEmojiClick(emoji) {
      console.log("got emoji click", emoji.detail.unicode);
      this.emoji = emoji.detail.unicode;
      this.emojiPicker = false;
    },
    async updateSDNA() {
        const perspectiveUuid = this.community.perspectiveUuid;
        updateSDNA(perspectiveUuid, {emoji: this.emoji, emojiCount: this.emojiCount});

        this.setShowCommunityTweaks(false);
    }
  },
  computed: {
    community(): LocalCommunityState {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getLocalCommunityState(id);
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
