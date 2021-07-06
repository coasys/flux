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
    element.expression = this.expression;
    // @ts-ignore
    this.$refs.container.appendChild(element);
  },
});
</script>
