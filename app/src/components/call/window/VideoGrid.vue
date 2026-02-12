<template>
  <div
    class="video-grid"
    :class="[selectedVideoLayout.class, { mobile: isMobile, 'landscape-mobile': isLandscapeMobile }]"
    :style="{ '--number-of-columns': numberOfColumns }"
  >
    <!-- Focused layout -->
    <template v-if="selectedVideoLayout.label === 'Focused'">
      <!-- Non-focused videos -->
      <template v-if="unfocusedParticipants.length">
        <div :class="isLandscapeMobile ? 'side-column' : 'bottom-row'">
          <MediaPlayer
            v-for="participant in unfocusedParticipants"
            :key="`participant-${participant.did}`"
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
      </template>

      <!-- Main focused video -->
      <MediaPlayer
        :key="`participant-${focusedParticipant.did}`"
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
        @click="!isLandscapeMobile && closeFocusedVideoLayout()"
      />
    </template>

    <!-- Other layouts (fixed aspect ratio, flexible) -->
    <template v-else>
      <MediaPlayer
        v-for="participant in allParticipants"
        :key="`participant-${participant.did}`"
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
import MediaPlayer from '@/components/media-player/MediaPlayer.vue';
import { useWebrtcStore, useUiStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';
import { useVideoLayout } from '../composables/useVideoLayout';

const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();
const { callEmojis } = storeToRefs(webrtcStore);
const { isMobile, isLandscapeMobile } = storeToRefs(uiStore);

const {
  selectedVideoLayout,
  numberOfColumns,
  allParticipants,
  focusedParticipant,
  unfocusedParticipants,
  focusOnVideo,
  closeFocusedVideoLayout,
} = useVideoLayout();

// Automatically focus on the first participant when switching to landscape mobile in focused layout
watch(isLandscapeMobile, (newVal) => {
  if (newVal && focusedParticipant.value) focusOnVideo(focusedParticipant.value.did);
}, { immediate: true });
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
  // Optimize rendering during layout changes
  will-change: grid-template-columns;
  transition: grid-template-columns 0.2s ease;

  &.mobile {
    grid-gap: var(--j-space-300);
  }

  > div {
    aspect-ratio: 16/9;
    width: 100%;
    height: auto;
    max-height: 100%;
    border-radius: 10px;
    // Prevent layout shifts from affecting media
    contain: layout style paint;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;

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

    &.landscape-mobile {
      flex-direction: row;
      overflow: hidden;

      > div:first-child {
        max-width: calc(100% - 120px);
      }
    }

    &.mobile:not(.landscape-mobile) > div:first-child {
      max-height: calc(100% - 80px);
    }

    &:not(.mobile):not(.landscape-mobile) > div:first-child {
      max-height: calc(100% - 140px);
    }

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
      justify-content: center;
      overflow-x: auto;
      gap: var(--j-space-400);
      flex: auto 0 0;

      > div {
        flex: 0 0 auto;
      }
    }

    &.mobile .bottom-row {
      height: 80px;
      justify-content: start;
    }

    &:not(.mobile) .bottom-row {
      height: 120px;
    }

    .side-column {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      gap: var(--j-space-300);
      width: 180px;
      height: 100%;
      flex: auto 0 0;

      > div {
        flex: 0 0 auto;
      }
    }
  }
}
</style>
