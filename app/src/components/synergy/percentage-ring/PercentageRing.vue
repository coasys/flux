<template>
  <div class="percentage-ring-wrapper" :style="{ width: `${ringSize}px`, height: `${ringSize}px` }">
    <svg>
      <defs>
        <linearGradient id="gradient" transform="rotate(180)">
          <stop offset="0%" stop-color="var(--j-color-primary-400)" />
          <stop offset="100%" stop-color="var(--j-color-primary-600)" />
        </linearGradient>
      </defs>
      <circle
        cx="50%"
        cy="50%"
        :r="radius"
        stroke="url(#gradient)"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${(circumference * score) / 100} ${circumference}`"
      />
    </svg>
    <p :style="{ fontSize: `${fontSize}px` }">{{ score.toFixed(1) }}%</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ ringSize: number; fontSize: number; score: number }>();

const radius = computed(() => props.ringSize / 2 - 10);
const circumference = computed(() => 2 * Math.PI * radius.value);
const strokeWidth = computed(() => props.ringSize / 10);
</script>

<style lang="scss" scoped>
.percentage-ring-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  svg {
    width: inherit;
    height: inherit;
    transform: rotate(-90deg);

    circle {
      fill: transparent;
      stroke-linecap: round;
    }
  }

  p {
    position: absolute;
    margin: 0;
  }
}
</style>
