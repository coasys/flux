<template>
  <div class="container">
    <img :src="image" class="img" />
    <div class="bottomContainer">
      <j-text>{{ title }}</j-text>
      <j-text>{{ description }}</j-text>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
export default defineComponent({
  props: ['title', 'description', 'image'],
});
</script>

<style>
.container {
  width: 200px;
  height: 200px;
  border: 1px solid grey;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 20px;
  margin-bottom: 20px;
  position: relative;
}

.bottomContainer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 10px;
}

.img {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}
</style>