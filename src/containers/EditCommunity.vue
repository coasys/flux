<template>
  <j-box p="800">
    <j-text variant="heading-sm">Edit Community</j-text>
    <avatar-upload
      :value="profileImage"
      @change="(val) => (profileImage = val)"
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
import { NeighbourhoodState } from "@/store/types";
import { defineComponent } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { useDataStore } from "@/store/data";
import { DexieIPFS } from "@/utils/storageHelpers";

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
      profileImage: "",
    };
  },
  watch: {
    community: {
      handler: async function ({ id, name, description, image }) {
        this.communityName = name;
        this.communityDescription = description;
        const dexie = new DexieIPFS(id);
        this.profileImage = await dexie.get(image!) as any;
      },
      deep: true,
      immediate: true,
    },
  },
  computed: {
    community(): NeighbourhoodState {
      const id = this.$route.params.communityId as string;
      return this.dataStore.getNeighbourhood(id);
    },
  },
  methods: {
    async updateCommunity() {
      const communityId = this.$route.params.communityId as string;
      this.isUpdatingCommunity = true;
      this.dataStore
        .updateCommunity({
          communityId: communityId,
          name: this.communityName,
          description: this.communityDescription,
          image: this.profileImage,
          thumbnail: this.profileImage,
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
