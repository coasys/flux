<template>
  <j-carousel ref="carousel" class="slider">
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb3 height="25vh"></Orb3>
        </j-box>
        <j-text variant="heading">Communicate Privately and Freely</j-text>
        <j-text variant="ingress">
          Without central servers, there's no way for third-parties to eavesdrop
          on your conversations or sell your data to advertisers
        </j-text>
      </div>
    </div>
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb height="25vh"></Orb>
        </j-box>
        <j-text variant="heading">
          Create Groups, Communities and Networks
        </j-text>
        <j-text variant="ingress">
          Organize and aggregate social organisms of any size or scale with a
          level of fluidity and interoperability only possible with p2p design
        </j-text>
      </div>
    </div>
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <Orb2 height="25vh"></Orb2>
        </j-box>
        <j-text variant="heading">Take Back the Internet</j-text>
        <j-text variant="ingress">
          With Holochain's agent-centric application framework, you own your
          data, manage your identity, and host the apps that you use with those
          you trust
        </j-text>
      </div>
    </div>
  </j-carousel>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Orb from "@/components/orb/Orb.vue";
import Orb2 from "@/components/orb/Orb2.vue";
import Orb3 from "@/components/orb/Orb3.vue";

export default defineComponent({
  components: {
    Orb,
    Orb2,
    Orb3,
  },
  data() {
    return {
      currentIndex: 0,
      interval: null as any,
    };
  },
  mounted() {
    this.interval = setInterval(() => {
      this.currentIndex = this.currentIndex >= 3 ? 0 : this.currentIndex + 1;
      const carousel = this.$refs.carousel as any;
      // TODO: Make j-carousel take a attribute instead of prop
      carousel.value = this.currentIndex;
    }, 3000);
  },
  unmounted() {
    clearInterval(this.interval);
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
