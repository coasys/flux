<template>
  <div v-if="hasPerspective" :class="styles.appContainer">
    <TodoView :perspective="perspective" :source="source" />
  </div>

  <template v-else>
    No perspective or agent client
  </template>
</template>

<script setup lang="ts">
import styles from "./Plugin.module.css";
import type { PerspectiveProxy } from "@coasys/ad4m";
import type { AgentClient } from "@coasys/ad4m";
import { computed } from 'vue';
import TodoView from "./components/TodoView.vue";

type Props = Partial<{
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}>

const { perspective, agent } = defineProps<Props>();

const hasPerspective = computed(
  () => perspective?.uuid != null && agent != null
)
</script>
