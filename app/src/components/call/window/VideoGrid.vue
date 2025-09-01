<template>
  <div
    ref="videoGrid"
    class="video-grid"
    :class="selectedVideoLayout.class"
    :style="{ '--number-of-columns': numberOfColumns }"
  >
    <!-- Focused layout -->
    <template v-if="selectedVideoLayout.label === 'Focused'">
      <!-- Main focused video -->
      <MediaPlayer
        :key="focusedParticipant.did"
        :did="focusedParticipant.did"
        :isMe="focusedParticipant.isMe"
        :inCall="focusedParticipant.inCall"
        :stream="focusedParticipant.stream"
        :streamReady="focusedParticipant.streamReady"
        :audioState="focusedParticipant.audioState"
        :videoState="focusedParticipant.videoState"
        :screenShareState="focusedParticipant.screenShareState"
        :warning="focusedParticipant.warning"
        :emojis="callEmojis.filter((emoji) => emoji.author === focusedParticipant.did)"
        @click="focusOnVideo(focusedParticipant.did)"
        :style="{ maxHeight: unfocusedParticipants.length ? 'calc(100% - 140px)' : 'none' }"
      />

      <!-- Non-focused videos -->
      <j-flex v-if="unfocusedParticipants.length" j="center">
        <div class="bottom-row">
          <MediaPlayer
            v-for="participant in unfocusedParticipants"
            :key="participant.did"
            :did="participant.did"
            :isMe="participant.isMe"
            :inCall="participant.inCall"
            :stream="participant.stream"
            :streamReady="participant.streamReady"
            :audioState="participant.audioState"
            :videoState="participant.videoState"
            :screenShareState="participant.screenShareState"
            :warning="participant.warning"
            :emojis="callEmojis.filter((emoji) => emoji.author === participant.did)"
            @click="focusOnVideo(participant.did)"
          />
        </div>
      </j-flex>
    </template>

    <!-- Other layouts (fixed aspect ratio, flexible) -->
    <template v-else>
      <MediaPlayer
        v-for="participant in allParticipants"
        :key="participant.did"
        :did="participant.did"
        :isMe="participant.isMe"
        :inCall="participant.inCall"
        :stream="participant.stream"
        :streamReady="participant.streamReady"
        :audioState="participant.audioState"
        :videoState="participant.videoState"
        :screenShareState="participant.screenShareState"
        :warning="participant.warning"
        :emojis="callEmojis.filter((emoji) => emoji.author === participant.did)"
        @click="focusOnVideo(participant.did)"
        :class="{ 'single-participant': unfocusedParticipants.length < 2 }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import MediaPlayer from "@/components/media-player/MediaPlayer.vue";
import { useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useVideoLayout } from "../composables/useVideoLayout";

const webrtcStore = useWebrtcStore();
const { callEmojis } = storeToRefs(webrtcStore);

const {
  selectedVideoLayout,
  numberOfColumns,
  allParticipants,
  focusedParticipant,
  unfocusedParticipants,
  focusOnVideo,
} = useVideoLayout();

const videoGrid = ref<HTMLElement | null>(null);
</script>

<style scoped lang="scss">
.video-grid {
  display: grid;
  grid-template-columns: repeat(var(--number-of-columns), 1fr);
  grid-gap: var(--j-space-400);
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  grid-auto-rows: min-content;

  > div {
    aspect-ratio: 16/9;
    width: 100%;
    height: auto;
    max-height: 100%;
    border-radius: 10px;

    &.single-participant {
      max-height: calc(100vh - 500px);
      width: min(calc((100vh - 500px) * 16 / 9), 100%);
    }
  }

  &:has(.single-participant) {
    justify-items: center;
  }

  &.flexible {
    height: 100%;
    grid-auto-rows: unset;

    > div {
      width: 100%;
      height: 100%;
      aspect-ratio: unset;
      min-height: 260px;
      max-height: none;
    }
  }

  &.focused {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    contain: strict;

    > div {
      flex: 1;
      width: 100%;
      height: 100%;
      aspect-ratio: unset;

      &.no-bottom-row {
        max-height: calc(100% - 20px);
      }
    }

    .bottom-row {
      display: flex;
      overflow-x: auto;
      gap: var(--j-space-400);
      height: 120px;

      > div {
        flex: 0 0 auto;
      }
    }
  }
}
</style>
