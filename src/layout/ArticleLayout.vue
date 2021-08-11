<template>
  <div class="article-layout">
    <header
      v-if="hideHero === false"
      class="article-layout__hero"
      :class="{ 'article-layout__hero--loading': heroImg ? false : true }"
    >
      <img class="article-layout__hero-image" v-if="heroImg" :src="heroImg" />
    </header>
    <main class="article-layout__main"><slot></slot></main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    heroImg: String,
    hideHero: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style>
.article-layout__hero {
  width: 100%;
  height: 30vh;
  position: relative;
}

.article-layout__hero--loading::after {
  display: block;
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: loading 1.5s infinite;
}

.article-layout__hero-image {
  width: 100%;
  height: 100%;
  min-height: 200px;
  max-height: 500px;
  object-fit: cover;
  position: relative;
  border: 0;
}

@keyframes loading {
  100% {
    transform: translateX(100%);
  }
}

.article-layout__main {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--j-space-800);
}
</style>
