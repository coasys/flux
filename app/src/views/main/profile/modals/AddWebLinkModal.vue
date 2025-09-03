<template>
  <j-modal
    size="sm"
    :open="modalStore.showAddWebLink"
    @toggle="(e: any) => (modalStore.showAddWebLink = e.target.open)"
  >
    <j-box p="800">
      <j-flex direction="column" gap="600" class="steps">
        <j-text variant="heading-sm">Add a link to your profile</j-text>
        <j-input
          label="Web link"
          size="xl"
          :value="link"
          autovalidate
          @invalid="() => (isValidLink = false)"
          @input="handleInput"
          type="url"
          required
        >
          <j-box pr="300" v-if="loadingMeta" slot="end">
            <j-spinner size="xxs" />
          </j-box>
        </j-input>

        <j-input
          ref="titleEl"
          v-if="isValidLink"
          :disabled="loadingMeta"
          size="xl"
          label="Title"
          :value="title"
          @input="(e: any) => (title = e.target.value)"
        />

        <j-input
          v-if="isValidLink"
          :disabled="loadingMeta"
          size="xl"
          type="textarea"
          label="Description"
          :value="description"
          @input="(e: any) => (description = e.target.value)"
        />

        <j-flex gap="400">
          <j-button full style="width: 100%" size="lg" @click="modalStore.showAddWebLink = false"> Cancel </j-button>
          <j-button
            style="width: 100%"
            full
            :disabled="isAddingLink || !isValidLink"
            :loading="isAddingLink"
            size="lg"
            variant="primary"
            @click="createLink"
          >
            <j-icon slot="end" name="add" />
            Add link
          </j-button>
        </j-flex>
      </j-flex>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { useAppStore, useModalStore } from "@/stores";
import { createAgentWebLink } from "@coasys/flux-api";
import { ref } from "vue";

defineProps({ step: { type: Number } });

const modalStore = useModalStore();

const title = ref("");
const description = ref("");
const imageUrl = ref("");
const link = ref("");
const loadingMeta = ref(false);
const isAddingLink = ref(false);
const isValidLink = ref(false);
const titleEl = ref<HTMLElement | null>(null);

async function getMeta() {
  try {
    loadingMeta.value = true;
    const data = await fetch("https://jsonlink.io/api/extract?url=" + link.value).then((res) => res.json());

    title.value = data.title || "";
    description.value = data.description || "";
    imageUrl.value = data.images[0] || "";
  } finally {
    loadingMeta.value = false;
    titleEl.value?.focus();
  }
}

async function handleInput(e: any) {
  try {
    link.value = e.target.value;
    await new URL(e.target.value);
    getMeta();
    isValidLink.value = true;
  } catch (e) {
    isValidLink.value = false;
  }
}

async function createLink() {
  isAddingLink.value = true;

  const appStore = useAppStore();

  try {
    await createAgentWebLink({
      title: title.value,
      description: description.value,
      imageUrl: imageUrl.value,
      url: link.value,
    });

    appStore.showSuccessToast({ message: "Link added to agent perspective" });

    // Reset form
    link.value = "";
    title.value = "";
    description.value = "";
    imageUrl.value = "";

    modalStore.showAddWebLink = false;
  } finally {
    isAddingLink.value = false;
  }
}
</script>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
}

.add {
  width: 150px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid grey;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 20px;
  margin-bottom: 20px;
}

.img_container {
  position: relative;
  margin-right: 20px;
  margin-bottom: 20px;
}

.img_bg {
  width: 150px;
  height: 150px;
  border: 1px solid grey;
  border-radius: 4px;
  cursor: pointer;
}

.close {
  position: absolute;
  top: 0;
  left: 0;
}

.steps {
  width: 100%;
}
</style>
