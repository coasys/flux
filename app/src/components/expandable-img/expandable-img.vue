<template>
  <div class="expandable-image" :class="{ expanded }" @click="expanded = true">
    <div class="close-button" v-if="expanded" @click="closeViewer">
      <j-icon name="x" size="xl" />
    </div>
    <div v-else class="expand-button">
      <j-icon name="arrows-angle-expand" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  ininheritAttrs: false,
  setup() {
    const clonedEl = ref<any>();
    const closeButtonRef = ref<any>();

    return {
      clonedEl,
      closeButtonRef,
    };
  },
  data() {
    return {
      expanded: false,
    };
  },
  methods: {
    closeViewer() {
      this.expanded = false;
    },
  },
  watch: {
    expanded(expanded) {
      this.$nextTick(() => {
        if (expanded) {
          this.clonedEl = this.$el.cloneNode(true);

          this.closeButtonRef = this.clonedEl.querySelector(".close-button");

          this.closeButtonRef.addEventListener("click", this.closeViewer);

          document.body.appendChild(this.clonedEl);
          document.body.style.overflow = "hidden";

          setTimeout(() => {
            this.clonedEl.style.opacity = 1;
          }, 0);
        } else {
          this.clonedEl.style.opacity = 0;

          setTimeout(() => {
            this.clonedEl.remove();
            this.clonedEl = null;
            this.closeButtonRef = null;
            document.body.style.overflow = "auto";
          }, 250);
        }
      });
    },
  },
});
</script>

<style scoped>
.expandable-image {
  position: relative;
  transition: 0.25s opacity;
}
body > .expandable-image.expanded {
  position: fixed;
  z-index: 999999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  opacity: 0;
  padding-bottom: 0 !important;
  cursor: default;
  background-origin: center;
  background-position: center;
  background-repeat: no-repeat;
}
body > .expandable-image.expanded > img {
  width: 100%;
  max-width: 1200px;
  max-height: 100%;
  object-fit: contain;
  margin: 0 auto;
}
body > .expandable-image.expanded > .close-button {
  display: block;
}
.close-button {
  position: fixed;
  top: 10px;
  right: 10px;
  display: none;
  cursor: pointer;
}

svg path {
  fill: #fff;
}
.expand-button {
  position: absolute;
  z-index: 999;
  right: 10px;
  top: 10px;
  padding: 0px;
  align-items: center;
  justify-content: center;
  padding: 3px;
  opacity: 0;
  transition: 0.2s opacity;
}
.expandable-image:hover .expand-button {
  opacity: 1;
}
.expand-button svg {
  width: 20px;
  height: 20px;
}
.expand-button path {
  fill: #fff;
}
.expandable-image img {
  width: 100%;
}
</style>
