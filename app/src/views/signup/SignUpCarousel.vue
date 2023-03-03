<template>
  <Orb class="orb"></Orb>
  <div class="wrapper">
    <j-button
      class="first"
      v-if="!isAtStart"
      variant="ghost"
      @click="scrollToPrevious"
    >
      <j-icon name="chevron-left"></j-icon>
    </j-button>
    <j-button
      class="last"
      variant="ghost"
      v-if="!isAtEnd"
      @click="scrollToNext"
    >
      <j-icon name="chevron-right"></j-icon>
    </j-button>
    <div class="slider" @scroll="handleScroll">
      <div id="first" class="slider__slide">
        <div class="slider__content">
          <Logo height="9vh" />
        </div>
      </div>
      <div id="second" class="slider__slide">
        <div class="slider__content">
          <j-text variant="heading-lg">Flux is fully peer-to-peer</j-text>
          <j-text variant="ingress">
            There are no centralized servers involved.
          </j-text>
        </div>
      </div>
      <div id="third" class="slider__slide">
        <div class="slider__content">
          <j-text variant="heading-lg">
            Each community in Flux manages its own distributed database
          </j-text>
          <j-text variant="ingress">
            You retain custody of all communications and content you create on
            Flux, sharing the hosting and serving of data only with those who
            have permission to view it.
          </j-text>
        </div>
      </div>
      <div id="fourth" class="slider__slide">
        <div class="slider__content">
          <j-text variant="heading-lg">Greater privacy and control </j-text>
          <j-text variant="ingress">
            To host and use Flux, download AD4M and run your own agent node
          </j-text>
        </div>
      </div>
    </div>
  </div>

  <j-box pt="500">
    <j-box pb="500" style="text-align: center" v-if="deferredPrompt">
      <j-button size="xl" variant="primary" @click="downloadPWA">
        Install for Chrome
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 48 48"
          height="20"
          width="20"
        >
          <defs>
            <linearGradient
              id="a"
              x1="3.2173"
              y1="15"
              x2="44.7812"
              y2="15"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color="#d93025" />
              <stop offset="1" stop-color="#ea4335" />
            </linearGradient>
            <linearGradient
              id="b"
              x1="20.7219"
              y1="47.6791"
              x2="41.5039"
              y2="11.6837"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color="#fcc934" />
              <stop offset="1" stop-color="#fbbc04" />
            </linearGradient>
            <linearGradient
              id="c"
              x1="26.5981"
              y1="46.5015"
              x2="5.8161"
              y2="10.506"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stop-color="#1e8e3e" />
              <stop offset="1" stop-color="#34a853" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="23.9947" r="12" style="fill: #fff" />
          <path
            d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z"
            style="fill: none"
          />
          <path
            d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z"
            style="fill: url(#a)"
          />
          <circle cx="24" cy="24" r="9.5" style="fill: #1a73e8" />
          <path
            d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z"
            style="fill: url(#b)"
          />
          <path
            d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z"
            style="fill: url(#c)"
          />
        </svg>
      </j-button>
    </j-box>
    <j-box align="center">
      <j-button
        :size="deferredPrompt ? 'md' : 'xl'"
        :variant="deferredPrompt ? 'secondary' : 'primary'"
        @click="connect"
      >
        <j-icon
          :size="deferredPrompt ? 'xs' : 'sm'"
          slot="end"
          name="arrow-repeat"
        ></j-icon>
        Connect to AD4M
      </j-button>
    </j-box>
  </j-box>
</template>

<script lang="ts">
import { ad4mConnect } from "@/ad4mConnect";
import { defineComponent } from "vue";
import Logo from "@/components/logo/Logo.vue";
import Orb from "./Orb.vue";

export default defineComponent({
  components: {
    Logo,
    Orb,
  },
  data() {
    return {
      deferredPrompt: null as any,
      currentIndex: 0,
      interval: null as any,
      isAtEnd: false,
      isAtStart: true,
    };
  },
  created() {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("before install");
      e.preventDefault();
      this.deferredPrompt = e;
    });
  },
  methods: {
    scrollToNext() {
      const container = document.querySelector(".slider");

      if (container) {
        container.scroll({
          left: container.scrollLeft + container.clientWidth,
          behavior: "smooth",
        });
      }
    },
    scrollToPrevious() {
      const container = document.querySelector(".slider");
      if (container) {
        container.scroll({
          left: container.scrollLeft - container.clientWidth,
          behavior: "smooth",
        });
      }
    },
    handleScroll() {
      const container = document.querySelector(".slider");
      if (!container) return;

      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth
      ) {
        this.isAtEnd = true;
      } else if (container.scrollLeft === 0) {
        this.isAtStart = true;
      } else {
        this.isAtEnd = false;
        this.isAtStart = false;
      }
    },
    connect() {
      ad4mConnect.connect();
    },
    async downloadPWA() {
      if (this.deferredPrompt) {
        // deferredPrompt is a global variable we've been using in the sample to capture the `beforeinstallevent`
        this.deferredPrompt.prompt();
        // Find out whether the user confirmed the installation or not
        const { outcome } = await this.deferredPrompt.userChoice;
        // The deferredPrompt can only be used once.
        this.deferredPrompt = null;
        // Act on the user's choice
        if (outcome === "accepted") {
          console.log("User accepted the install prompt.");
        } else if (outcome === "dismissed") {
          console.log("User dismissed the install prompt");
        }
      }
    },
  },
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
