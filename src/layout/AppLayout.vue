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
  grid-template-columns: var(--app-main-sidebar-width) 1fr;
}
.app-layout__sidebar {
  background: var(--app-main-sidebar-bg-color);
  height: 100%;
  border-right: 1px var(--app-main-sidebar-border-color) solid;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.app-layout__main {
  max-height: 100vh;
  z-index: 0;
}
</style>
