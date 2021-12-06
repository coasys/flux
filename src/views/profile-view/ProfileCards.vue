<template>
  <div class="container">
    <div class="img">
      <img v-if="image" :src="image" />
    </div>
    <div class="content">
      <j-flex j="between">
        <div style="cursor: pointer">
          <j-text size="600" color="black">{{ computedTitle }}</j-text>
          <j-text nomargin>{{ computedDescription }}</j-text>
        </div>
        <j-popover 
          placement="auto" 
          event="click"
          :open="showContextMenu"
          @toggle="(e) => (showContextMenu = e.target.open)"
          v-if="sameAgent"
        >
        <j-button 
          slot="trigger" 
          @click.stop="() => showContextMenu = !showContextMenu" 
          variant="ghost" 
          squared 
          size="sm"
        >
          <j-icon name="three-dots-vertical"></j-icon>
        </j-button>
          <j-icon  name="three-dots-vertical"></j-icon>
            <j-menu slot="content">
              <j-menu-item @click.stop="() => $emit('delete')">Edit</j-menu-item>
              <j-menu-item @click.stop="() => $emit('delete')">Delete</j-menu-item>
            </j-menu>
        </j-popover>

      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: ["title", "description", "image", "sameAgent"],
  emits: ['delete'],
  data() {
    return {
      showContextMenu: false
    }
  },
  computed: {
    computedTitle() {
      return this.title.length > 15 ? `${this.title.substring(0, 15)}...` : this.title;
    },
    computedDescription() {
      return this.description.length > 20 ? `${this.description.substring(0, 15)}...` : this.description;
    }
  }
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
