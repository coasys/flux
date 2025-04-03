<template>
  <j-box p="800">
    <j-text variant="heading-sm">Edit Community</j-text>
    <avatar-upload
      :value="communityImage"
      @change="(val) => (communityImage = val)"
    />
    <j-flex direction="column" gap="400">
      <j-input
        size="lg"
        label="Name"
        :value="communityName"
        @keydown.enter="updateCommunity"
        @input="(e) => (communityName = e.target.value)"
      ></j-input>
      <j-input
        size="lg"
        label="Description"
        :value="communityDescription"
        @keydown.enter="updateCommunity"
        @input="(e) => (communityDescription = e.target.value)"
      ></j-input>
      <div>
        <j-button size="lg" @click="$emit('cancel')">Cancel</j-button>
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

<script lang="ts">
import { defineComponent } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import {
  blobToDataURL,
  dataURItoBlob,
  getImage,
  resizeImage,
} from "@coasys/flux-utils";
import { usePerspective, useModel } from "@coasys/ad4m-vue-hooks";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { Community } from "@coasys/flux-api";

export default defineComponent({
  components: { AvatarUpload },
  props: ["communityId"],
  emits: ["cancel", "submit"],
  async setup(props) {
    const client = getAd4mClient;
    const { data } = usePerspective(client, () => props.communityId);

    const { entries: communities } = useModel({
      perspective: () => data.value.perspective,
      model: Community,
      query: { where: { base: "ad4m://self" } },
    });

    return {
      perspective: data.value.perspective,
      community: communities.value[0],
    };
  },
  data() {
    return {
      isUpdatingCommunity: false,
      communityName: "",
      communityDescription: "",
      communityImage: "",
    };
  },
  watch: {
    community: {
      handler: async function (community) {
        this.communityName = community?.name;
        this.communityDescription = community?.description;
        this.communityImage = community?.image;
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    async updateCommunity() {
      try {
        this.isUpdatingCommunity = true;

        let compressedImage = undefined;

        if (this.communityImage) {
          // TODO: Compression should maybe happen on the language level?
          compressedImage = await blobToDataURL(
            await resizeImage(dataURItoBlob(this.communityImage as string), 0.6)
          );
        }

        const community = new Community(this.perspective!, this.community.baseExpression);
        community.name = this.communityName;
        community.description = this.communityDescription;
        community.image = compressedImage
          ? {
              data_base64: compressedImage,
              name: "form-image",
              file_type: "image/png",
            }
          : undefined,
        await community.update();
      } catch (e) {
        console.log(e);
      } finally {
        this.$emit("submit");
        this.isUpdatingCommunity = false;
      }
    },
  },
});
</script>
