<template>
  <div
    class="skeleton"
    :class="{ 'skeleton--circle': variant === 'circle' }"
    :style="{ width: computedWidth, height: computedHeight }"
  ></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    height: {
      type: String,
      default: "20px",
    },
    width: {
      type: String,
      default: "100%",
    },
    variant: {
      type: String as PropType<"circle" | "rectangle">,
      default: "rectangle",
    },
  },
  computed: {
    computedHeight() {
      switch (this.height) {
        case "xs" || "sm" || "md" || "lg" || "xl":
          return `var(--j-size-${this.height})`;
        default:
          return this.height;
      }
    },
    computedWidth() {
      switch (this.width) {
        case "xs" || "sm" || "md" || "lg" || "xl":
          return `var(--j-size-${this.width})`;
        default:
          return this.width;
      }
    },
  },
});
</script>

<style scoped>
.skeleton {
  border-radius: var(--j-border-radius);
  background: linear-gradient(
    90deg,
    var(--j-color-ui-100) 0%,
    var(--j-color-ui-200) 50%,
    var(--j-color-ui-100) 100%
  );
  animation: placeHolderShimmer 10s linear infinite;
}

.skeleton.skeleton--circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  animation: placeHolderShimmer 30s linear infinite;
}

@keyframes placeHolderShimmer {
  0% {
    background-position: -500px 0;
  }
  100% {
    background-position: 500px 0;
  }
}
</style>
