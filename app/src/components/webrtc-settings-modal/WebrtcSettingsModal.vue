<template>
  <div class="wrapper">
    <div class="menu">
      <j-menu-group-item title="Settings">
        <j-menu-item :selected="currentTab === 'voice-video'" @click="currentTab = 'voice-video'">
          Voice & Video
        </j-menu-item>
        <j-menu-item :selected="currentTab === 'transcription'" @click="currentTab = 'transcription'">
          Transcription
        </j-menu-item>
        <j-menu-item :selected="currentTab === 'connection'" @click="currentTab = 'connection'">
          Connection
        </j-menu-item>
        <!-- <j-menu-item :selected="currentTab === 'debug'" @click="currentTab = 'debug'"> Debug </j-menu-item> -->
      </j-menu-group-item>
    </div>

    <div class="contents">
      <VoiceVideo v-if="currentTab === 'voice-video'" />
      <Transcription v-if="currentTab === 'transcription'" />
      <Connection v-if="currentTab === 'connection'" />
      <Debug v-if="currentTab === 'debug'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import Connection from "./Connection.vue";
import Debug from "./Debug.vue";
import Transcription from "./Transcription.vue";
import VoiceVideo from "./VoiceVideo.vue";

const currentTab = ref("voice-video");
</script>

<style scoped>
.wrapper {
  display: grid;
  gap: var(--j-space-200);
}

@media (min-width: 800px) {
  .wrapper {
    grid-template-columns: 1fr 3fr;
    gap: var(--j-space-300);
  }
}

.menu {
  display: block;
  padding: var(--j-space-800) 0 var(--j-space-400) 0;
  background: var(--j-color-ui-50);
}
@media (min-width: 800px) {
  .menu {
    padding: var(--j-space-400) 0;
  }
}

.contents {
  display: flex;
  flex-direction: column;
  min-height: 30rem;
  padding: var(--j-space-400);
}
@media (min-width: 800px) {
  .contents {
    padding: var(--j-space-500);
  }
}
</style>
