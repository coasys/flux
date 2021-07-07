<template>
  <div ref="container"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    element: {
      type: String,
      required: true,
    },
    expression: Object,
  },
  mounted() {
    const element = document.createElement(this.element) as any;
    // @ts-ignore
    this.$refs.container.appendChild(element);
    // @ts-ignore
    const el = this.$refs.container.querySelector(this.element);
    el.expression = this.expression?.data;
  },
});
</script>
