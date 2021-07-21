<template>
  <div class="article-layout">
    <header class="article-layout__hero">
      <img class="article-layout__hero-image" :src="heroImg" />
    </header>
    <main class="article-layout__main"><slot></slot></main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["heroImg"],
});
</script>

<style>
.article-layout__hero-image {
  width: 100%;
  height: 30vh;
  min-height: 200px;
  max-height: 500px;
  object-fit: cover;
}
.article-layout__main {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--j-space-800);
}
</style>
