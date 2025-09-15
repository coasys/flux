<template>
  <div class="progress">
    <div class="progress-bar" :style="{ width: `calc((100% / 8) * ${currentStep})` }" />
    <j-text nomargin class="progress-text" color="ui-700" size="400">
      <b>{{ steps[currentStep - 1] }}</b> ({{ currentStep }}/8)
    </j-text>
  </div>
</template>

<script lang="ts" setup>
type Props = { steps: string[]; currentStep: number };
defineProps<Props>();
</script>

<style lang="scss" scoped>
.progress {
  position: relative;
  width: 100%;
  height: 24px;
  border-radius: 12px;
  background-color: var(--j-color-ui-100);
  box-shadow: 0 0 0 1px var(--j-color-ui-300);

  .progress-bar {
    height: 24px;
    border-radius: 12px;
    background-color: var(--j-color-primary-300);
    transition: width 0.3s ease-in-out;
  }

  .progress-text {
    position: absolute;
    top: 2.5px;
    left: 10px;
  }
}
</style>
