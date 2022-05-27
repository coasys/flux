<template>
  <div a="center" direction="column" class="outer_container">
    <div a="start" direction="column" class="inner_container">
      <j-text variant="heading">{{ link.has_name }}</j-text>
      <j-text variant="subheading">{{ link.has_description }}</j-text>
      <div class="grid">
        <expandable-image
          class="img"
          :style="{ backgroundImage: `url(${img})` }"
          v-for="(img, index) in link.has_images"
          :key="`img-${index}`"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ExpandableImage from "@/components/expandable-img/expandable-img.vue";

export default defineComponent({
  name: "ProfileFeed",
  components: {
    ExpandableImage,
  },
  setup() {
    const link = ref<any>({});

    return {
      link,
    };
  },
  mounted() {
    this.link = this.$route.params;
  },
});
</script>

<style scoped>
.outer_container {
  width: 100%;
  height: 100%;
  padding: 40px 0;
  overflow-y: auto;
}

.inner_container {
  width: 800px;
  min-height: 100vh;
  height: 100%;
  margin: auto;
}

.img {
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 240px;
  height: 240px;
  margin-right: 20px;
}

.grid {
  display: flex;
  flex-wrap: wrap;
}
</style>
