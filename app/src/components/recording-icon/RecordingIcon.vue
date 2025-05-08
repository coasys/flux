<template>
  <div class="recording-icon" :style="`width: ${size}px; height: ${size}px`">
    <div class="icon1" />
    <div class="icon2" />
  </div>
</template>

<script setup lang="ts">
defineProps({ size: { type: Number, default: 20 } });
</script>

<style scoped lang="scss">
@keyframes pulse1 {
  0% {
    transform: scale(0.4);
  }
  25% {
    transform: scale(0.5);
  }
  50% {
    transform: scale(0.4);
  }
  100% {
    transform: scale(0.4);
  }
}

@keyframes pulse2 {
  0% {
    transform: scale(0.4);
    opacity: 0.8;
  }
  50% {
    transform: scale(1);
    opacity: 0;
  }
  100% {
    transform: scale(0.4);
    opacity: 0;
  }
}
.recording-icon {
  $speed: 1.8s;

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;

  .icon1,
  .icon2 {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #e62b63;
  }

  .icon1 {
    animation: pulse1 $speed ease-in infinite;
  }

  .icon2 {
    animation: pulse2 $speed ease-in infinite;
  }
}
</style>
