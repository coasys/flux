<template>
  <div class="slider">
    <div class="slider__slide" v-if="currentIndex === 0">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb3 height="30vh"></Orb3>
        </j-box>
        <div>
          <Logo height="7vh" />
          <j-box pt="500">
            <j-text size="800" color="black">
              A Toolkit for the New Internet
            </j-text>
          </j-box>
        </div>
        <j-box py="500">
          <j-box pb="500" v-if="deferredPrompt">
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
          <j-flex a="center" j="center" direction="row" gap="200">
            <j-button
              :size="deferredPrompt ? 'md' : 'xl'"
              variant="link"
              @click="$emit('connectToAd4m')"
            >
              Sign in
            </j-button>
            <j-button
              :size="deferredPrompt ? 'md' : 'xl'"
              :variant="deferredPrompt ? '' : 'primary'"
              @click="currentIndex = 1"
            >
              Get started
            </j-button>
          </j-flex>
        </j-box>
      </div>
    </div>
    <div class="slider__slide" v-if="currentIndex === 1">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb height="30vh"></Orb>
        </j-box>
        <div>
          <j-text variant="heading-lg">
            Each person that uses Flux also hosts and serves its application
            data
          </j-text>
          <j-text variant="ingress">
            There are no centralized servers involved.
          </j-text>
        </div>
        <j-box py="600">
          <j-flex j="center" a="center" gap="500">
            <j-button variant="link" size="xl" @click="currentIndex = 0">
              Previous
            </j-button>
            <j-button variant="primary" size="xl" @click="currentIndex = 2">
              Next
            </j-button>
          </j-flex>
        </j-box>
      </div>
    </div>
    <div class="slider__slide" v-if="currentIndex === 2">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb2 height="30vh"></Orb2>
        </j-box>
        <div>
          <j-text variant="heading-lg">
            Each community in Flux manages its own distributed database
          </j-text>
          <j-text variant="ingress">
            You retain custody of all communications and content you create on
            Flux, sharing the hosting and serving of data only with those who
            have permission to view it.
          </j-text>
        </div>
        <j-box py="600">
          <j-flex j="center" a="center" gap="500">
            <j-button variant="link" size="xl" @click="currentIndex = 1">
              Previous
            </j-button>
            <j-button variant="primary" size="xl" @click="currentIndex = 3">
              Next
            </j-button>
          </j-flex>
        </j-box>
      </div>
    </div>
    <div class="slider__slide" v-if="currentIndex === 3">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb2 height="30vh"></Orb2>
        </j-box>
        <div>
          <j-text variant="heading-lg">Greater privacy and control </j-text>
          <j-text variant="ingress">
            To host and use Flux, download AD4M and run your own agent node
          </j-text>
        </div>
        <j-box py="600">
          <j-flex j="center" a="center" gap="500">
            <j-button variant="link" size="xl" @click="currentIndex = 2">
              Previous
            </j-button>
            <j-button
              @click="$emit('connectToAd4m')"
              variant="primary"
              size="xl"
            >
              Log in
            </j-button>
          </j-flex>
        </j-box>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Logo from "@/components/logo/Logo.vue";
import Orb from "@/components/orb/Orb.vue";
import Orb2 from "@/components/orb/Orb2.vue";
import Orb3 from "@/components/orb/Orb3.vue";

export default defineComponent({
  components: {
    Logo,
    Orb,
    Orb2,
    Orb3,
  },
  emits: ["connectToAd4m"],
  data() {
    return {
      deferredPrompt: null as any,
      currentIndex: 0,
      interval: null as any,
    };
  },
  mounted() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
  },
  methods: {
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
.slider {
  height: 100%;
}
.slider__slide {
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
}

.slider__slide-content {
  height: 100%;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 750px;
  margin: 0 auto;
  padding: var(--j-space-500);
}
</style>
