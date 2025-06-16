<template>
  <j-box p="800">
    <j-text variant="heading-sm">Edit Community</j-text>
    <avatar-upload :value="communityImage" @change="(val) => (communityImage = val || '')" />
    <j-flex direction="column" gap="400">
      <j-input
        size="lg"
        label="Name"
        :value="communityName"
        @keydown.enter="updateCommunity"
        @input="(e: any) => (communityName = e.target.value)"
      />
      <j-input
        size="lg"
        label="Description"
        :value="communityDescription"
        @keydown.enter="updateCommunity"
        @input="(e: any) => (communityDescription = e.target.value)"
      />
      <div>
        <j-button size="lg" @click="emit('cancel')">Cancel</j-button>
        <j-button
          size="lg"
          :loading="isUpdatingCommunity"
          :disabled="isUpdatingCommunity"
          @click="updateCommunity"
          variant="primary"
        >
          Save
        </j-button>
      </div>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { useModel, usePerspective } from "@coasys/ad4m-vue-hooks";
import { Community } from "@coasys/flux-api";
import { blobToDataURL, dataURItoBlob, resizeImage } from "@coasys/flux-utils";
import { computed, ref, watch } from "vue";

interface Props {
  communityId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ cancel: []; submit: [] }>();

const isUpdatingCommunity = ref(false);
const communityName = ref("");
const communityDescription = ref("");
const communityImage = ref("");

// Setup AD4M client and perspective
const client = await getAd4mClient();
const { data } = usePerspective(client, () => props.communityId);

// Setup community model
const { entries: communities } = useModel({
  perspective: computed(() => data.value.perspective),
  model: Community,
  query: { where: { base: "ad4m://self" } },
});

// Computed properties
const perspective = computed(() => data.value.perspective);
const community = computed(() => communities.value?.[0] || null);

// Methods
async function updateCommunity() {
  try {
    isUpdatingCommunity.value = true;

    let compressedImage = undefined;

    if (communityImage.value) {
      // TODO: Compression should maybe happen on the language level?
      compressedImage = await blobToDataURL(await resizeImage(dataURItoBlob(communityImage.value as string), 0.6));
    }

    const communityModel = new Community(perspective.value!, community.value.baseExpression);
    communityModel.name = communityName.value;
    communityModel.description = communityDescription.value;
    // @ts-ignore
    communityModel.image = compressedImage
      ? {
          data_base64: compressedImage,
          name: "form-image",
          file_type: "image/png",
        }
      : undefined;

    await communityModel.update();

    emit("submit");
  } catch (e) {
    console.log(e);
  } finally {
    isUpdatingCommunity.value = false;
  }
}

// Watchers
watch(
  community,
  async (newCommunity) => {
    if (newCommunity) {
      communityName.value = newCommunity.name || "";
      communityDescription.value = newCommunity.description || "";
      communityImage.value = newCommunity.image || "";
    }
  },
  { deep: true, immediate: true }
);
</script>
