<template>
  <div class="sidebar-layout">
    <aside class="sidebar-layout__sidebar"><slot name="sidebar"></slot></aside>
    <main class="sidebar-layout__main"><slot></slot></main>
  </div>
</template>

<style>
.sidebar-layout {
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  display: grid;
  grid-template-columns: 300px 1fr;
}
.sidebar-layout__sidebar {
  height: 100%;
  overflow-y: auto;
  border-right: 1px var(--j-color-ui-50) solid;
}
.sidebar-layout__main {
  max-height: 100vh;
  position: relative;
}
</style>
