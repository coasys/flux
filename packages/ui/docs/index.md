---
layout: home
---

<div class="hero-img" v-html="UISvg"></div>

<ThreeOrb class="hero__orb"></ThreeOrb>

<div class="container">

<div class="hero">
<div class="hero-content">
<h1 class="hero-title">Build the future of group collaboration</h1>

<p class="hero-lead">Create custom apps for your community</p>
</div>
</div>

<div class="cards">
  <a href="/ui-library/getting-started/installation.html" class="card">
    <h2 class="card-title">UI Library</h2>
    <p class="card-desc">
    A comprehensive collection of user interface components designed specifically for Flux.
    </p> 
    <button class="card-button">Read the docs</button>
  </a>
  <a href="/create-flux-app/getting-started/installation.html" class="card">
    <h2 class="card-title">Create Flux App</h2>
    <p class="card-desc">
    Get started building custom components and integrating with Flux in just a few clicks.
    </p>
    <button class="card-button">Build an app</button>
  </a>
</div>

</div>

<script setup>
import UISvg from './assets/group.svg?raw';
//import ThreeOrb from "./ThreeOrb.vue";

</script>

<style>

.hero__orb {
  position: absolute;
  left: 50%;
  top: 50%;
  height: clamp(400px, 80vw, 1000px);
  /* max-height: 600px; */
  transform: translateX(-50%) translateY(-50%);
  animation: fade-in 1s ease both;
  animation-delay: 0.4s;
  z-index: -1;
}

.container {
  width: 100%;
  margin: 0 auto;
  max-width: calc(var(--vp-layout-max-width) - 64px)
}

.hero {
  padding-top: 10rem;
  text-align: center;
}

.hero-title {
  font-size: 5rem;
  max-width: 1000px;
  margin: 0 auto;
  font-family: var(--j-font-family-heading);
  color: var(--j-color-black);
  line-height: 1;
  font-weight: 800;
  margin-bottom: 3rem;
}

.funky {
  font-family: var(--j-font-family-funky);
}

.hero-lead {
  margin: 2rem auto 0 auto;
  font-size: 2.4rem;
}

.hero-img svg {
  position: fixed;
  top: 0;
  left: 50vw;
  max-height: 100vh;
  transform: translateX(-52%);
  z-index: -2;
  opacity: 0.7;
  margin: 0 auto;
  width: 100%;
  color: var(--j-color-ui-100);
  max-width: 2000px;
}

.cards {
  padding-top: 4rem;
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: center;
  gap: 4rem;
}

.card {
  color: var(--j-color-black);
  border-radius: var(--j-border-radius);
  min-height: 200px;
  text-align: left;
  padding: var(--j-space-700);
  background: transparent;
  transition: all 0.2s ease;
}

.card:hover {
  filter: brightness(1.1);
}

.card-img * {
  width: 100%;
  max-width: 100%;
  color: var(--j-color-black);
}

.card-title {
  font-size: 1.8rem;
  line-height: 2.8rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.card-desc {
  font-size: 1rem;
  margin-bottom: 2rem;
}

.card-button {
  font-family: inherit;
  cursor: pointer;
  display: inline-block;
  font-size: 1rem;
  font-weight: 500;
  padding: 1rem 1.5rem;
  color: var(--j-color-black);
  border: 1px solid var(--j-color-black);
  border-radius: 300px;
  background: transparent;
}

.card-button:hover {
  background: var(--j-color-black);
  color: var(--j-color-white);
}

</style>
