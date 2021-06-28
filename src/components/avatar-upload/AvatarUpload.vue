<template>
  <div class="avatar-upload" id="fileInputButton" @click="onFileClick">
    <j-flex direction="column" gap="400" a="center">
      <j-avatar
        id="myProfile"
        :hash="hash"
        size="xl"
        :src="value"
        initials="P"
      ></j-avatar>
      <j-button v-if="!value" size="sm">Upload image</j-button>
      <j-button v-if="value" @click.prevent="$emit('change', null)" size="sm">
        Remove image
      </j-button>
    </j-flex>
  </div>
  <input
    :disabled="disabled"
    id="fileInput"
    type="file"
    style="display: none"
    @change="selectFile"
  />
  <div class="cropper" v-if="tempProfileImage !== null">
    <cropper
      ref="cropper"
      class="cropper__element"
      backgroundClass="cropper__background"
      :src="tempProfileImage"
      :stencil-props="{
        aspectRatio: 12 / 12,
      }"
    ></cropper>
    <j-box pt="300">
      <j-button @click="clearImage">Cancel</j-button>
      <j-button variant="primary" @click="selectImage">Crop</j-button>
    </j-box>
  </div>
</template>

<script lang="ts">
import "vue-advanced-cropper/dist/style.css";
import { defineComponent } from "vue";
import { Cropper } from "vue-advanced-cropper";

export default defineComponent({
  components: { Cropper },
  emits: ["change"],
  props: ["value", "disabled", "hash"],
  data() {
    return {
      tempProfileImage: null,
    };
  },
  methods: {
    onFileClick() {
      document.getElementById("fileInput")?.click();
    },
    selectFile(e: any) {
      const files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;

      var reader = new FileReader();

      reader.onload = (e) => {
        const temp: any = e.target?.result;
        this.tempProfileImage = temp;
      };

      reader.readAsDataURL(files[0]);
    },
    clearImage() {
      this.tempProfileImage = null;
    },
    selectImage() {
      const result = (this.$refs.cropper as any).getResult();
      const data = result.canvas.toDataURL();
      this.tempProfileImage = null;
      this.$emit("change", data);
    },
  },
});
</script>

<style lang="scss" scoped>
.avatar-upload {
  background-color: var(--junto-border-color);
  border-radius: 100px;
  background-size: cover;
}
.avatar-upload j-avatar {
  --j-avatar-size: 150px;
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
</style>
