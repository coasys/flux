<template>
  <div class="avatar-upload" id="fileInputButton" @click="onFileClick">
    <j-flex direction="column" gap="400" a="center">
      <div class="avatar-upload__avatar" :style="{ width: size, height: size }">
        <img :src="value" v-if="value" />
        <j-icon v-else class="avatar-upload__icon" :name="icon" size="lg" />
      </div>
      <j-button variant="link" v-if="!value" size="sm">Upload image</j-button>
      <j-button variant="link" v-if="value" @click="removeImage" size="sm"> Remove image </j-button>
    </j-flex>
  </div>
  <input
    :disabled="disabled"
    ref="fileInput"
    id="fileInput"
    type="file"
    accept="image/*"
    style="display: none"
    @change="selectFile"
  />
  <div class="cropper" v-if="tempProfileImage !== null">
    <Cropper
      ref="cropper"
      class="cropper__element"
      backgroundClass="cropper__background"
      :src="tempProfileImage"
      :stencil-props="{
        aspectRatio: 12 / 12,
      }"
    />
    <j-box pt="500">
      <j-flex gap="400" j="center">
        <j-button @click="clearImage">Cancel</j-button>
        <j-button variant="primary" @click="selectImage">Crop</j-button>
      </j-flex>
    </j-box>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import 'vue-advanced-cropper';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import 'vue-advanced-cropper/dist/theme.bubble.css';

interface Props {
  value?: string;
  disabled?: boolean;
  hash?: string;
  size?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), { size: '7rem', icon: 'person-fill' });

const emit = defineEmits<{ change: [value: string | null] }>();

const fileInput = ref<HTMLInputElement>();
const cropper = ref<InstanceType<typeof Cropper>>();
const tempProfileImage = ref<string | null>(null);

function onFileClick() {
  fileInput.value?.click();
}

function selectFile(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files || (e as any).dataTransfer?.files;
  if (!files?.length) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const temp = e.target?.result as string;
    tempProfileImage.value = temp;
  };

  reader.readAsDataURL(files[0]);
}

function removeImage(e: Event) {
  e.preventDefault();
  e.stopPropagation();

  if (fileInput.value) fileInput.value.value = '';
  emit('change', null);
}

function clearImage() {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  tempProfileImage.value = null;
}

function selectImage() {
  if (!cropper.value) return;

  const result = cropper.value.getResult();
  const data = result.canvas.toDataURL();
  tempProfileImage.value = null;
  emit('change', data);
}
</script>

<style lang="scss" scoped>
.avatar-upload {
  background-color: var(--junto-border-color);
  border-radius: 100px;
  background-size: cover;
}
.avatar-upload j-avatar {
  --j-avatar-size: 7rem;
}

.avatar-upload__avatar {
  display: grid;
  place-items: center;
  background: var(--j-color-ui-200);
  text-align: center;
  cursor: pointer;
  width: 7rem;
  height: 7rem;
  border-radius: 50%;
}

.avatar-upload__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-upload__icon {
  color: var(--j-color-white);
}

.cropper {
  background: var(--j-color-white);
  padding: var(--j-space-500);
  border-radius: var(--j-border-radius);
  box-shadow: var(--j-depth-300);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  z-index: 999;
}

.cropper__element {
  flex-grow: 1;
  max-height: 80vh;

  &__background {
    background: transparent !important;
  }
}

/* Deep selector inside scoped styles */
.cropper:deep(.vue-simple-handler) {
  background: var(--j-color-primary-500) !important;
}
</style>
