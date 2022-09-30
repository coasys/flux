<template>
  <div class="container">
    <j-flex direction="column" gap="400" v-if="step === 1" class="steps">
      <j-text variant="heading">Add a link to profile</j-text>
      <j-button full @click="() => selectLinkType('community')"
        >Add Community</j-button
      >
      <j-button full @click="() => selectLinkType('webLink')"
        >Add a web link</j-button
      >
      <j-button full @click="() => selectLinkType('simpleArea')"
        >Add Gallery</j-button
      >
    </j-flex>
    <div v-else>
      <simple-image-add
        v-if="linkType === 'simpleArea'"
        @cancel="onGoBack"
        @submit="onSubmit"
        @changeStep="(i) => (step = i)"
      />
      <community-add
        v-if="linkType === 'community'"
        @cancel="onGoBack"
        @submit="onSubmit"
        @changeStep="(i) => (step = i)"
      />
      <web-link-add
        v-if="linkType === 'webLink'"
        @cancel="onGoBack"
        @submit="onSubmit"
        @changeStep="(i) => (step = i)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import SimpleImageAdd from "./SimpleImageAdd.vue";
import CommunityAdd from "./CommunityAdd.vue";
import WebLinkAdd from "./WebLinkAdd.vue";

export type linkType = "community" | "simpleArea" | "webLink" | null;

export default defineComponent({
  emits: ["cancel", "submit"],
  setup() {
    const linkType = ref<linkType>(null);
    const step = ref(1);

    return {
      linkType,
      step,
    };
  },
  methods: {
    onSubmit() {
      this.step = 1;
      this.$emit("submit");
    },
    onGoBack() {
      this.step = 1;
    },
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
  padding: var(--j-space-1000);
}

.steps {
  width: 100%;
}
</style>
