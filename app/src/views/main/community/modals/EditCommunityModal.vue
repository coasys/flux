<template>
  <j-modal
    size="sm"
    :open="modalStore.showEditCommunity"
    @toggle="(e: any) => (modalStore.showEditCommunity = e.target.open)"
  >
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
          <j-button size="lg" @click="modalStore.showEditCommunity = false">Cancel</j-button>
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
  </j-modal>
</template>

<script setup lang="ts">
import AvatarUpload from '@/components/avatar-upload/AvatarUpload.vue';
import { useCommunityService } from '@/composables/useCommunityService';
import { useModalStore } from '@/stores';
import { Community } from '@coasys/flux-api';
import { blobToDataURL, dataURItoBlob, resizeImage } from '@coasys/flux-utils';
import { ref, watch } from 'vue';

const modalStore = useModalStore();

const { perspective, community } = useCommunityService();

const isUpdatingCommunity = ref(false);
const communityName = ref('');
const communityDescription = ref('');
const communityImage = ref('');

async function updateCommunity() {
  try {
    isUpdatingCommunity.value = true;

    let compressedImage = undefined;

    if (communityImage.value) {
      // TODO: Compression should maybe happen on the language level?
      compressedImage = await blobToDataURL(await resizeImage(dataURItoBlob(communityImage.value as string), 0.6));
    }

    const communityModel = new Community(perspective, community.value.baseExpression);
    communityModel.name = communityName.value;
    communityModel.description = communityDescription.value;
    // @ts-ignore
    communityModel.image = compressedImage
      ? {
          data_base64: compressedImage,
          name: 'form-image',
          file_type: 'image/png',
        }
      : undefined;

    await communityModel.update();
  } catch (e) {
    console.log(e);
  } finally {
    isUpdatingCommunity.value = false;
    modalStore.showEditCommunity = false;
  }
}

watch(
  community,
  async (newCommunity) => {
    if (newCommunity) {
      communityName.value = newCommunity.name || '';
      communityDescription.value = newCommunity.description || '';
      // @ts-ignore
      communityImage.value = newCommunity.image || '';
    }
  },
  { deep: true, immediate: true },
);
</script>
