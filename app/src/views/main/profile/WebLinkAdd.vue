<template>
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
        type="text"
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
        <j-button full style="width: 100%" size="lg" @click="emit('cancel')"> Cancel </j-button>
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
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores";
import { createAgentWebLink } from "@coasys/flux-api";
import { ref } from "vue";

defineProps({ step: { type: Number } });
const emit = defineEmits(["cancel", "submit"]);

const title = ref("");
const description = ref("");
const imageUrl = ref("");
const link = ref("");
const loadingMeta = ref(false);
const isAddingLink = ref(false);
const isValidLink = ref(false);
const titleEl = ref<HTMLElement | null>(null);
let metaDebounce: ReturnType<typeof setTimeout> | null = null;

function normalizeUrl(input: string): string {
  const value = (input || "").trim();
  if (!value) return value;
  // If already has a scheme, keep as is
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value);
  return hasScheme ? value : `https://${value}`;
}

function looksLikeHost(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    // Require a dot or be localhost to reduce early validations like "https://exa"
    return host === "localhost" || host.includes(".");
  } catch {
    return false;
  }
}

async function getMeta(urlForMeta: string) {
  try {
    loadingMeta.value = true;
    const data = await fetch("https://jsonlink.io/api/extract?url=" + encodeURIComponent(urlForMeta)).then((res) =>
      res.json()
    );

    title.value = data.title || "";
    description.value = data.description || "";
    imageUrl.value = data.images[0] || "";
  } finally {
    loadingMeta.value = false;
  }
}

async function handleInput(e: any) {
  try {
    link.value = e.target.value;
    const normalized = normalizeUrl(link.value);

    // If it doesn't look like a host yet, consider invalid and skip meta fetch
    if (!looksLikeHost(normalized)) {
      isValidLink.value = false;
      if (metaDebounce) clearTimeout(metaDebounce);
      return;
    }

    // Validate
    // new URL will throw if not valid
    // We intentionally do not mutate the visible input to avoid caret jumps
    // Use a debounced meta fetch to avoid interrupting typing
    new URL(normalized);
    isValidLink.value = true;
    if (metaDebounce) clearTimeout(metaDebounce);
    metaDebounce = setTimeout(() => {
      getMeta(normalized);
    }, 500);
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
      url: normalizeUrl(link.value),
    });

    appStore.showSuccessToast({ message: "Link added to agent perspective" });

    // Reset form
    link.value = "";
    title.value = "";
    description.value = "";
    imageUrl.value = "";

    emit("submit");
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
