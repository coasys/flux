<template>
  <div class="container">
    <simple-image-add
      :isEditing="true"
      v-if="linkType === 'simpleArea'"
      @submit="onSubmit"
      @cancel="onCancel"
      :area="area"
    />
    <community-add
      :isEditing="true"
      v-if="linkType === 'community'"
      @submit="onSubmit"
      @cancel="onCancel"
      :area="area"
    />
    <web-link-add
      :isEditing="true"
      v-if="linkType === 'webLink'"
      @submit="onSubmit"
      @cancel="onCancel"
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
  props: ["area"],
  emits: ["cancel", "submit"],
  setup() {
    const linkType = ref<linkType>(null);

    return {
      linkType,
    };
  },
  watch: {
    area: {
      handler: function (area) {
        if (area) {
          this.linkType = area.area_type;
        }
      },
      immediate: true,
    },
  },
  methods: {
    onSubmit(): void {
      this.$emit("submit");
    },
    onCancel(): void {
      this.$emit("cancel");
    },
    selectLinkType(type: linkType) {
      this.linkType = type;
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
