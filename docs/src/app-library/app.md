---
layout: page
---

<div class="container">

<flux-container>
    <j-spinner v-if="isLoading"></j-spinner>
</flux-container>
</div>

<style scoped>

flux-container:first-child(*) {
    height: 100%;
    display: block;
    box-sizing: border-box;
}

.container {
    width: 100%;
    margin: 0 auto;
    padding-left: 1rem;
    padding-right: 1rem;
    height: calc(100vh - var(--vp-nav-height));
    overflow: hidden;
    max-width: calc(var(--vp-layout-max-width));
}

</style>

<script setup lang="ts">
import "@fluxapp/flux-container";
import {onMounted, ref} from 'vue'

const isLoading = ref(false);
const urlParams = new URLSearchParams(window.location.search);
const pkg = urlParams.get('pkg');

onMounted(async () => {

isLoading.value = true;

try {

const wcName = await generateWCName(pkg);

const el = document.createElement(wcName);
el.style.height = "calc(100vh - var(--vp-nav-height))";
el.style.display = "block";
el.style.boxSizing = "border-box"

document.querySelector("flux-container").append(el);

if (!customElements.get(wcName)) {
    const module = await import(`https://cdn.jsdelivr.net/npm/${pkg}/+esm`);
    customElements.define(wcName, module.default); 
}

} catch(e) {
    console.log(e);
} finally {
    isLoading.value = false;
}

});

async function generateWCName(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const firstPart = hashBase64
    .substr(0, 5)
    .toLowerCase()
    .replace(/[^a-z]/g, (c) => alphabet[c.charCodeAt(0) % alphabet.length]);
  const secondPart = hashBase64
    .substr(5, 4)
    .toLowerCase()
    .replace(/[^a-z]/g, (c) => alphabet[c.charCodeAt(0) % alphabet.length]);
  return `${firstPart}-${secondPart}`;
}


</script>
