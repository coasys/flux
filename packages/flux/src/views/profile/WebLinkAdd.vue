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
        type="url"
        required
      >
        <j-box pr="300" v-if="loadingMeta" slot="end">
          <j-spinner size="xxs"></j-spinner>
        </j-box>
      </j-input>

      <j-input
        ref="titleEl"
        v-if="isValidLink"
        :disabled="loadingMeta"
        size="xl"
        label="Title"
        :value="title"
        @input="(e) => (title = e.target.value)"
      ></j-input>

      <j-input
        v-if="isValidLink"
        :disabled="loadingMeta"
        size="xl"
        type="textarea"
        label="Description"
        :value="description"
        @input="(e: any) => (description = e.target.value)"
      ></j-input>

      <j-flex gap="400">
        <j-button full style="width: 100%" size="lg" @click="$emit('cancel')">
          Cancel
        </j-button>
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

<script lang="ts">
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { useAppStore } from "@/store/app";
import { defineComponent, ref } from "vue";
import {
  AREA_WEBLINK,
  OG_DESCRIPTION,
  OG_TITLE,
  OG_IMAGE,
} from "utils/constants/profile";
import { createLiteralObject } from "utils/helpers/linkHelpers";

export default defineComponent({
  props: ["step"],
  emits: ["cancel", "submit"],

  setup() {
    return {
      title: ref(""),
      description: ref(""),
      imageUrl: ref(""),
      link: ref(""),
      loadingMeta: ref(false),
      isAddingLink: ref(false),
      isValidLink: ref(false),
    };
  },
  methods: {
    async getMeta() {
      try {
        this.loadingMeta = true;
        const data = await fetch(
          "https://jsonlink.io/api/extract?url=" + this.link
        ).then((res) => res.json());

        this.title = data.title || "";
        this.description = data.description || "";
        this.imageUrl = data.images[0] || "";
      } catch (e) {
        console.log(e);
      } finally {
        this.loadingMeta = false;
        this.$refs.titleEl?.focus();
      }
    },
    async handleInput(e: any) {
      try {
        this.link = e.target.value;
        await new URL(e.target.value);
        this.getMeta();
        this.isValidLink = true;
      } catch (e) {
        this.isValidLink = false;
      }
    },
    async createLink() {
      const client = await getAd4mClient();
      this.isAddingLink = true;

      const appStore = useAppStore();

      const links = await createLiteralObject({
        parent: {
          source: `self`,
          predicate: AREA_WEBLINK,
          target: this.link || "",
        },
        children: {
          [OG_TITLE]: this.title || "",
          [OG_DESCRIPTION]: this.link || "",
          [OG_DESCRIPTION]: this.description || "",
          [OG_IMAGE]: this.imageUrl || "",
        },
      });

      await client.agent.mutatePublicPerspective({
        additions: links,
        removals: [],
      });

      appStore.showSuccessToast({
        message: "Link added to agent perspective",
      });

      this.link = "";
      this.title = "";
      this.description = "";
      this.link = "";
      this.imageUrl = "";
      this.isAddingLink = false;

      this.$emit("submit");
    },
  },
});
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
