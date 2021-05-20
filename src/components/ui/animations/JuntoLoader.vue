<template>
  <teleport to="body">
    <div class="loadingAnimationBackground">
      <div class="loadingAnimation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
  </teleport>
</template>

<style lang="scss" scoped>
.loadingAnimationBackground {
  height: 100vh;
  width: 100vw;
  background-color: rgba(var(--junto-background-rgba), 0.8);
  opacity: 50%;
  z-index: 150000;
  position: absolute;
  top: 0;
  left: 0;
}
.loadingAnimation,
.loadingAnimation * {
  box-sizing: border-box;
  z-index: 200000;
}

.loadingAnimation {
  height: 15px;
  width: calc(30px * 3);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.loadingAnimation .dot {
  width: 1.2rem;
  height: 1.2rem;
  margin: 0 calc(1.2rem / 2);
  border: calc(1.2rem / 5) solid var(--junto-primary);
  border-radius: 50%;
  float: left;
  transform: scale(0);
  animation: loadingAnimation-animation 1000ms ease infinite 0ms;
}

.loadingAnimation .dot:nth-child(1) {
  animation-delay: calc(300ms * 1);
}

.loadingAnimation .dot:nth-child(2) {
  animation-delay: calc(300ms * 2);
}

.loadingAnimation .dot:nth-child(3) {
  animation-delay: calc(300ms * 3);
}

@keyframes loadingAnimation-animation {
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
