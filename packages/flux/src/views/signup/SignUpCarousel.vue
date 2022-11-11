<template>
  <div class="slider">
    <div class="slider__slide" v-if="currentIndex === 0">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb3 height="40vh"></Orb3>
        </j-box>
        <Logo height="7vh" />
        <j-box pt="500">
          <j-text size="800" color="black">
            A Toolkit for the New Internet
          </j-text>
        </j-box>
        <j-box py="500">
          <j-button size="xl" @click="currentIndex = 1" variant="primary">
            Get Started
          </j-button>
        </j-box>
      </div>
    </div>
    <div class="slider__slide" v-if="currentIndex === 1">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb height="40vh"></Orb>
        </j-box>
        <j-text variant="heading">
          Each person that uses Flux also hosts and serves its application data
        </j-text>
        <j-text variant="ingress">
          There are no centralized servers involved.
        </j-text>
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
          <Orb2 height="40vh"></Orb2>
        </j-box>
        <j-text variant="heading">
          Each community in Flux manages its own distributed database
        </j-text>
        <j-text variant="ingress">
          You retain custody of all communications and content you create on
          Flux, sharing the hosting and serving of data only with those who have
          permission to view it.
        </j-text>
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
          <Orb2 height="40vh"></Orb2>
        </j-box>
        <j-text variant="heading">Greater privacy and control </j-text>
        <j-text variant="ingress">
          To host and use Flux, download AD4M and run your own agent node
        </j-text>
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
              Sign in
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
      currentIndex: 0,
      interval: null as any,
    };
  },
});
</script>

<style scoped>
.slider__slide {
  text-align: center;
}

.slider__slide-content {
  max-width: 750px;
  margin: 0 auto;
  padding: var(--j-space-900);
}
</style>
