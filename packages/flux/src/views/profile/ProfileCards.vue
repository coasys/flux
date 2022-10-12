<template>
  <div class="container">
    <Avatar
      size="lg"
      style="--j-avatar-bg: var(--j-color-ui-500)"
      :url="image"
    ></Avatar>
    <j-flex direction="column" j="between">
      <j-text size="600" weight="800" color="black">
        {{ title }}
      </j-text>
      <j-text nomargin size="400" color="ui-300">{{ description }}</j-text>
    </j-flex>
    <j-popover
      placement="top-start"
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
import Avatar from "@/components/avatar/Avatar.vue";
export default defineComponent({
  components: { Avatar },
  props: ["title", "description", "image", "sameAgent"],
  emits: ["delete", "edit"],
  data() {
    return {
      showContextMenu: false,
    };
  },
});
</script>

<style scoped>
.container {
  position: relative;
  cursor: pointer;
  width: 100%;
  border-radius: var(--j-border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--j-space-400);
  text-align: center;
  text-decoration: none;
  padding: var(--j-space-700);
  background-color: var(--j-color-ui-50);
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
