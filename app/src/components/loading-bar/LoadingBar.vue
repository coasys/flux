<template>
  <div class="loading-box">
    <div class="loader"></div>
  </div>
</template>

<style scoped>
.loading-box {
  position: relative;
  width: 100%;
  height: 5px;
  border-radius: 50px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 0px solid var(--j-color-primary-500);
  overflow: hidden;
}

.loader {
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 50px;
  background: linear-gradient(
    45deg,
    var(--j-color-primary-500),
    var(--j-color-primary-300)
  );
  left: 0%;
}

.loader {
  transform: translateX(-100%);
  animation: load 2.2s linear infinite;
}

@keyframes load {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
