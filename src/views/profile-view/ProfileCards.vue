<template>
  <div class="container">
    <div class="img">
      <img v-if="image" :src="image" />
    </div>
    <div class="content">
      <j-flex j="between">
        <div style="cursor: pointer">
          <j-text size="600" color="black">{{ title }}</j-text>
          <j-text nomargin>{{ description }}</j-text>
        </div>
        <j-button @click.stop variant="ghost" squared size="sm">
          <j-icon name="three-dots-vertical"></j-icon>
        </j-button>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: ["title", "description", "image"],
});
</script>

<style scoped>
.container {
  width: 100%;
  border: 1px solid var(--j-color-ui-50);
  border-radius: var(--j-border-radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--j-color-white);
}

.container:hover {
  background-color: var(--j-color-ui-50);
}

.img {
  cursor: pointer;
  display: block;
  width: 100%;
  height: 200px;
  background: var(--j-color-ui-100);
}

.img img {
  max-width: 100%;
  height: 100%;
  width: 100%;
  overflow: hidden;
  object-fit: cover;
  background-repeat: no-repeat;
  background-size: cover;
}

.content {
  padding: var(--j-space-500);
}
</style>
