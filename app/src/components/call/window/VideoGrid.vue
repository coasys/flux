<template>
  <div
    class="video-grid"
    :class="[
      selectedVideoLayout.class,
      {
        mobile: isMobile,
        'landscape-mobile': isLandscapeMobile,
        fullscreen: callWindowFullscreen,
      },
    ]"
    :style="{
      '--number-of-columns': numberOfColumns,
      '--number-of-rows': numberOfRows,
      '--last-row-tiles': lastRowTiles,
    }"
  >
    <!-- Focused layout -->
    <template v-if="selectedVideoLayout.label === 'Focused'">
      <!-- Non-focused videos -->
      <template v-if="unfocusedParticipants.length">
        <div :class="isLandscapeMobile ? 'side-column' : 'bottom-row'">
          <MediaPlayer
            v-for="participant in unfocusedParticipants"
            :key="`participant-${participantKey(participant)}`"
            :did="participant.did"
            :isMe="participant.isMe"
            :muteAudio="participant.muteAudio"
            :inCall="participant.inCall"
            :stream="participant.stream"
            :streamReady="participant.streamReady"
            :audioState="participant.audioState"
            :videoState="participant.videoState"
            :screenShareState="participant.screenShareState"
            :warning="participant.warning"
            :emojis="callEmojis.filter((emoji) => emoji.author === participant.did)"
            @click="focusOnVideo(participantKey(participant))"
          />
        </div>
      </template>

      <!-- Main focused video -->
      <MediaPlayer
        v-if="focusedParticipant"
        :key="`participant-${participantKey(focusedParticipant)}`"
        :did="focusedParticipant.did"
        :isMe="focusedParticipant.isMe"
        :muteAudio="focusedParticipant.muteAudio"
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
        v-for="(participant, index) in allParticipants"
        :key="`participant-${participantKey(participant)}`"
        :did="participant.did"
        :isMe="participant.isMe"
        :muteAudio="participant.muteAudio"
        :inCall="participant.inCall"
        :stream="participant.stream"
        :streamReady="participant.streamReady"
        :audioState="participant.audioState"
        :videoState="participant.videoState"
        :screenShareState="participant.screenShareState"
        :warning="participant.warning"
        :emojis="callEmojis.filter((emoji) => emoji.author === participant.did)"
        @click="focusOnVideo(participantKey(participant))"
        :class="{
          'single-participant': unfocusedParticipants.length < 2,
          'last-row-center': isLastRowOffsetTile(index),
        }"
        :style="lastRowStyleFor(index)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import MediaPlayer from '@/components/media-player/MediaPlayer.vue';
import { useWebrtcStore, useUiStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useVideoLayout } from '../composables/useVideoLayout';

const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();
const { callEmojis } = storeToRefs(webrtcStore);
const { isMobile, isLandscapeMobile, callWindowFullscreen } = storeToRefs(uiStore);

const {
  selectedVideoLayout,
  numberOfColumns,
  allParticipants,
  focusedParticipant,
  unfocusedParticipants,
  focusOnVideo,
  closeFocusedVideoLayout,
  participantKey,
} = useVideoLayout();

// Centring the trailing row when it doesn't fill all columns means we have
// to know two things at template time: how many rows the grid will use
// (so the auto-fit CSS can divide remaining height evenly) and how many
// tiles land in that final row (so we can shift them inward via
// `grid-column-start`).
const numberOfRows = computed(() => {
  const total = allParticipants.value.length;
  const cols = numberOfColumns.value;
  if (total === 0 || cols <= 0) return 1;
  return Math.ceil(total / cols);
});

const lastRowTiles = computed(() => {
  const total = allParticipants.value.length;
  const cols = numberOfColumns.value;
  if (total === 0 || cols <= 0) return 0;
  const remainder = total % cols;
  return remainder === 0 ? cols : remainder;
});

const firstTileInLastRowIndex = computed(() => {
  if (lastRowTiles.value === numberOfColumns.value) return -1;
  return allParticipants.value.length - lastRowTiles.value;
});

function isLastRowOffsetTile(index: number): boolean {
  // Only the very first tile of an incomplete trailing row needs an
  // explicit column offset; the others fall into the next grid cell
  // automatically once that first tile is shifted.
  return index === firstTileInLastRowIndex.value;
}

function lastRowStyleFor(index: number): Record<string, string> | undefined {
  if (!isLastRowOffsetTile(index)) return undefined;
  // Centre the partial row by leaving `(cols - tiles) / 2` empty columns to
  // its left.  Using `grid-column-start` is enough — subsequent tiles flow
  // naturally and the trailing row reads as visually centred.
  const offset = Math.floor((numberOfColumns.value - lastRowTiles.value) / 2);
  if (offset <= 0) return undefined;
  return { 'grid-column-start': String(offset + 1) };
}

// Automatically focus on the first participant when switching to landscape mobile in focused layout
watch(
  isLandscapeMobile,
  (newVal) => {
    if (newVal && focusedParticipant.value) focusOnVideo(participantKey(focusedParticipant.value));
  },
  { immediate: true },
);
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

  // Fullscreen / expanded grids should make every tile fit on screen
  // instead of overflowing.  Switch from `min-content` rows to N equal
  // rows that share the available height, and cap each tile's width by
  // its 16/9 aspect ratio so they don't stretch into bands when the
  // available height is the tighter axis.
  &.fullscreen {
    height: 100%;
    overflow: hidden;
    grid-auto-rows: unset;
    grid-template-rows: repeat(var(--number-of-rows), 1fr);
    justify-content: center;

    > div {
      width: 100%;
      height: 100%;
      max-height: 100%;
      max-width: 100%;
      // Preserve 16/9: when height is the limiting axis, `min()` clamps
      // width so tiles don't get letterboxed unevenly within their grid cell.
      // (CSS aspect-ratio still applies — `min()` is the upper bound.)
      align-self: center;
      justify-self: center;
    }
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
      flex: 0 0 auto;

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
      flex: 0 0 auto;

      > div {
        flex: 0 0 auto;
      }
    }
  }
}
</style>
