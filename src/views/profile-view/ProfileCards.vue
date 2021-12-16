<template>
  <div class="container">
    <div>
      <div class="img">
        <img v-if="image" :src="image" />
      </div>
    </div>
    <j-flex j="between">
      <div style="cursor: pointer">
        <j-text nomargin size="600" color="black">{{ title }}</j-text>
        <j-text nomargin>{{ description }}</j-text>
      </div>
    </j-flex>
    <j-popover
      placement="auto"
      event="click"
      :open="showContextMenu"
      @toggle="(e) => (showContextMenu = e.target.open)"
      v-if="sameAgent"
    >
      <j-button
        class="menu-button"
        slot="trigger"
        @click.stop="() => (showContextMenu = !showContextMenu)"
        variant="ghost"
        squared
        size="sm"
      >
        <j-icon name="three-dots"></j-icon>
      </j-button>
      <j-menu slot="content">
        <j-menu-item @click.stop="() => $emit('edit')">Edit</j-menu-item>
        <j-menu-item @click.stop="() => $emit('delete')">Delete</j-menu-item>
      </j-menu>
    </j-popover>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: ["title", "description", "image", "sameAgent"],
  emits: ["delete", "edit"],
  data() {
    return {
      showContextMenu: false,
    };
  },
  computed: {
    computedTitle() {
      return this.title.length > 15
        ? `${this.title.substring(0, 15)}...`
        : this.title;
    },
    computedDescription() {
      return this.description.length > 20
        ? `${this.description.substring(0, 15)}...`
        : this.description;
    },
  },
});
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  border: 1px solid var(--j-color-ui-50);
  border-radius: var(--j-border-radius);
  display: flex;
  overflow: hidden;
  gap: var(--j-space-500);
  background-color: var(--j-color-white);
  padding: var(--j-space-500);
}

.container:hover {
  background-color: var(--j-color-ui-50);
}

.img {
  cursor: pointer;
  display: block;
  width: 60px;
  height: 60px;
  padding: 3px;
  border-radius: 50%;
  background: white;
}

.menu-button {
  position: absolute;
  right: var(--j-space-100);
  top: var(--j-space-100);
}

.img img {
  max-width: 100%;
  height: 100%;
  width: 100%;
  border-radius: 50%;
  overflow: hidden;
  object-fit: cover;
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
