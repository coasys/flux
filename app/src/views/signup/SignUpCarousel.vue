<template>
  <Orb class="orb" />
  <div class="wrapper">
    <j-button class="first" v-if="!isAtStart" variant="ghost" @click="scrollToPrevious">
      <j-icon name="chevron-left" />
    </j-button>
    <j-button class="last" variant="ghost" v-if="!isAtEnd" @click="scrollToNext">
      <j-icon name="chevron-right" />
    </j-button>
    <div class="slider" @scroll="handleScroll">
      <div id="first" class="slider__slide">
        <div class="slider__content">
          <FluxLogoIcon height="9vh" />
        </div>
      </div>
      <div id="second" class="slider__slide">
        <div class="slider__content">
          <j-text variant="heading-lg">Flux is fully peer-to-peer</j-text>
          <j-text variant="ingress"> There are no centralized servers involved. </j-text>
        </div>
      </div>
      <div id="third" class="slider__slide">
        <div class="slider__content">
          <j-text variant="heading-lg"> Each community in Flux manages its own distributed database </j-text>
          <j-text variant="ingress">
            You retain custody of all communications and content you create on Flux, sharing the hosting and serving of
            data only with those who have permission to view it.
          </j-text>
        </div>
      </div>
      <div id="fourth" class="slider__slide">
        <div class="slider__content">
          <j-text variant="heading-lg">Greater privacy and control </j-text>
          <j-text variant="ingress"> To host and use Flux, download AD4M and run your own agent node </j-text>
        </div>
      </div>
    </div>
  </div>

  <j-box pt="500">
    <j-box pb="500" style="text-align: center" v-if="deferredPrompt">
      <j-button size="xl" variant="primary" @click="downloadPWA">
        Install for Chrome
        <ChromeIcon />
      </j-button>
    </j-box>
    <j-box>
      <j-flex a="center" j="center">
        <j-button
          :size="deferredPrompt ? 'md' : 'xl'"
          :variant="deferredPrompt ? 'secondary' : 'primary'"
          @click="connect"
        >
          <j-icon :size="deferredPrompt ? 'xs' : 'sm'" slot="end" name="arrow-repeat" />
          Connect to AD4M
        </j-button>
      </j-flex>
    </j-box>
  </j-box>
</template>

<script setup lang="ts">
import { ad4mConnect } from '@/ad4mConnect';
import { ChromeIcon, FluxLogoIcon } from '@/components/icons';
import { onMounted, ref } from 'vue';
import Orb from './Orb.vue';

const deferredPrompt = ref<any>(null);
const isAtEnd = ref(false);
const isAtStart = ref(true);

function scrollToNext() {
  const container = document.querySelector('.slider');

  if (container) {
    container.scroll({
      left: container.scrollLeft + container.clientWidth,
      behavior: 'smooth',
    });
  }
}

function scrollToPrevious() {
  const container = document.querySelector('.slider');
  if (container) {
    container.scroll({
      left: container.scrollLeft - container.clientWidth,
      behavior: 'smooth',
    });
  }
}

function handleScroll() {
  const container = document.querySelector('.slider');
  if (!container) return;

  if (container.scrollLeft + container.clientWidth >= container.scrollWidth) {
    isAtEnd.value = true;
  } else if (container.scrollLeft === 0) {
    isAtStart.value = true;
  } else {
    isAtEnd.value = false;
    isAtStart.value = false;
  }
}

function connect() {
  ad4mConnect.connect();
}

async function downloadPWA() {
  if (deferredPrompt.value) {
    // deferredPrompt is a global variable we've been using in the sample to capture the `beforeinstallevent`
    deferredPrompt.value.prompt();
    // Find out whether the user confirmed the installation or not
    const { outcome } = await deferredPrompt.value.userChoice;
    // The deferredPrompt can only be used once.
    deferredPrompt.value = null;
    // Act on the user's choice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt.');
    } else if (outcome === 'dismissed') {
      console.log('User dismissed the install prompt');
    }
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });
});
</script>

<style scoped>
.first,
.last {
  animation: fade-in 1s ease both;
}

.first {
  z-index: 1;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.last {
  z-index: 1;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.orb {
  position: absolute;
  left: 50%;
  top: 50%;
  width: clamp(400px, 80vw, 100vh) !important;
  height: clamp(400px, 80vw, 100vh) !important;
  /* max-height: 600px; */
  transform: translateX(-50%) translateY(-50%);
  animation: fade-in 2s ease both;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.wrapper {
  width: 100%;
  overflow: hidden;
  position: relative;
}

/*

.wrapper::before {
  position: absolute;
  top: 0;
  left: 0;
  content: "";
  height: 100%;
  width: 5%;
  z-index: 100;
  background: linear-gradient(
    90deg,
    var(--j-color-white),
    var(--j-color-white),
    transparent
  );
}

.wrapper::after {
  position: absolute;
  top: 0;
  right: 0;
  content: "";
  height: 100%;
  width: 5%;
  z-index: 100;
  background: linear-gradient(
    -90deg,
    var(--j-color-white),
    var(--j-color-white),
    transparent
  );
}

*/

.slider {
  display: flex;
  gap: var(--j-space-500);
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  scroll-padding: 0 5%;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  position: relative;
  scroll-behavior: smooth;
}

.slider::-webkit-scrollbar {
  display: none;
}

.slider__slide {
  flex-shrink: 0;
  text-align: center;
  border: 1px solid var(--color-black);
  color: var(--color-black);
  display: grid;
  grid-template-columns: 1fr;
  place-content: center;
  scroll-snap-align: center;
  padding: 0 var(--j-space-900);
  width: 100vw;
  max-width: 100%;
  border-radius: 20px;
}

.slider__content {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}
</style>
