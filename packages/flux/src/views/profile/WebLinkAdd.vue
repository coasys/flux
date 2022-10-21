<template>
  <j-box p="800">
    <j-flex direction="column" gap="400" class="steps">
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
        @blur="getMeta"
      >
      </j-input>

      <j-flex gap="400">
        <j-button full style="width: 100%" size="lg" @click="$emit('cancel')">
          <j-icon v-if="!isEditing" slot="start" name="arrow-left-short" />
          {{ isEditing ? "Cancel" : "Back" }}
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
          {{ isEditing ? "Save" : "Add link" }}
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
import getOGData from "utils/helpers/getOGData";
import { createLiteralObject } from "utils/helpers/linkHelpers";

export default defineComponent({
  props: ["step", "isEditing"],
  emits: ["cancel", "submit"],

  setup() {
    return {
      title: ref(""),
      description: ref(""),
      imageUrl: ref(""),
      link: ref(""),
      isAddingLink: ref(false),
      isValidLink: ref(false),
    };
  },
  methods: {
    async getMeta() {
      try {
        const data = await getOGData(this.link);

        console.log(data);

        this.title = data.title || data["og:title"];
        this.description = data.description || data["og:description"];
        this.imageUrl = data["og:image"];
      } catch (e) {
        console.log(e);
      }
    },
    handleInput(e: any) {
      function validURL(str: string) {
        var pattern = new RegExp(
          "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
          "i"
        ); // fragment locator
        return !!pattern.test(str);
      }
      this.link = e.target.value;
      const isValidLink = validURL(e.target.value);
      this.getMeta();
      this.isValidLink = isValidLink;
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
          [OG_DESCRIPTION]: this.link || "",
          [OG_TITLE]: this.title || "",
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
