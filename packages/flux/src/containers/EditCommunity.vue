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
import { Community } from "utils/types";
import { defineComponent } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { useDataStore } from "@/store/data";
import { DexieIPFS } from "utils/helpers/storageHelpers";

export default defineComponent({
  components: { AvatarUpload },
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
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
      handler: async function ({ id, name, description, image }) {
        this.communityName = name;
        this.communityDescription = description;
        const dexie = new DexieIPFS(id);
        this.communityImage = (await dexie.get(image!)) as any;
      },
      deep: true,
      immediate: true,
    },
  },
  computed: {
    community(): Community {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getCommunity(id);
    },
  },
  methods: {
    async updateCommunity() {
      const communityId = this.$route.params.communityId as string;
      this.isUpdatingCommunity = true;
      this.dataStore
        .updateCommunity({
          communityId: communityId,
          name:
            this.communityName !== this.community.name
              ? this.communityName
              : undefined,
          description:
            this.communityDescription !== this.community.description
              ? this.communityDescription
              : undefined,
          image:
            this.communityImage !== this.community.image
              ? this.communityImage
              : undefined,
          thumbnail:
            this.communityImage !== this.community.image
              ? this.communityImage
              : undefined,
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isUpdatingCommunity = false;
        });
    },
  },
});
</script>
