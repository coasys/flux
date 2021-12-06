t<template>
  <div class="container">
    <simple-image-add
      v-if="linkType === 'simpleArea'"
      :step="step"
      @submit="$emit('submit')"
      @changeStep="(i) => (step = i)"
      :area="area"
    />
    <community-add
      v-if="linkType === 'community'"
      :step="step"
      @submit="$emit('submit')"
      @changeStep="(i) => (step = i)"
      :area="area"
    />
    <web-link-add
      v-if="linkType === 'webLink'"
      :step="step"
      @submit="$emit('submit')"
      @changeStep="(i) => (step = i)"
      :area="area"
    />
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { defineComponent } from "vue-demi";
import SimpleImageAdd from "./SimpleImageAdd.vue";
import CommunityAdd from "./CommunityAdd.vue";
import WebLinkAdd from "./WebLinkAdd.vue";

export type linkType = "community" | "simpleArea" | "webLink" | null;

export default defineComponent({
  props: ['area'],
  emits: ["cancel", "submit"],
  setup() {
    const linkType = ref<linkType>(null);
    const step = ref(2);

    return {
      linkType,
      step,
    };
  },
  watch: {
    area() {
      if (this.area) {
        this.linkType = this.area.area_type;
      }
    }
  },
  methods: {
    selectLinkType(type: linkType) {
      this.linkType = type;
      this.step = 2;
    },
  },
  components: {
    SimpleImageAdd,
    CommunityAdd,
    WebLinkAdd,
  },
});
</script>

<style scoped>
.container {
  margin: 0 auto;
  min-height: 300px;
  max-height: 800px;
  height: 100%;
  width: 100%;
  display: flex;
  align-content: center;
  padding: var(--j-space-1000);
}

.steps {
  width: 100%;
}
</style>
