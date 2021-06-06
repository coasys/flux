<template>
  <div class="app-layout">
    <div class="app-layout__sidebar"><slot name="sidebar"></slot></div>
    <main class="app-layout__main"><slot></slot></main>
  </div>
</template>

<style>
.app-layout {
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  display: grid;
  grid-template-columns: 100px 1fr;
}
.app-layout__sidebar {
  height: 100%;
  border-right: 1px var(--j-color-ui-50) solid;
  display: flex;
  position: relative;
  z-index: 999;
  flex-direction: column;
  justify-content: space-between;
}
.app-layout__main {
  max-height: 100vh;
  z-index: 0;
}
</style>
