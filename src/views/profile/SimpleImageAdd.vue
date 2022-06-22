<template>
  <j-flex direction="column" gap="400" class="steps">
    <j-text variant="heading">Gallery</j-text>
    <j-input
      label="Title"
      size="xl"
      :value="title"
      @input="(e) => (title = e.target.value)"
      :error="titleError"
      :errorText="titleErrorMessage"
      @blur="(e) => validateTitle"
    ></j-input>
    <j-input
      label="Description"
      size="xl"
      :value="description"
      @input="(e) => (description = e.target.value)"
    ></j-input>
    <j-text>Images</j-text>
    <div class="grid">
      <div
        v-for="(img, index) of imgs"
        :key="`${img}-${index}`"
        class="img_container"
      >
        <div class="img_bg" :style="{ backgroundImage: `url(${img})` }"></div>
        <div class="close" @click="() => imgs.splice(index, 1)">
          <j-icon name="x-circle"></j-icon>
        </div>
      </div>
      <div class="add" @click="onFileClick">
        <j-icon name="plus" size="lg"></j-icon>
        <j-text>Add Link</j-text>
        <input
          id="simpleAreaImgInput"
          style="display: none"
          type="file"
          @change.prevent="selectFile"
        />
      </div>
    </div>
    <j-flex gap="400">
      <j-button full style="width: 100%" size="lg" @click="$emit('cancel')">
        <j-icon v-if="!isEditing" slot="start" name="arrow-left-short" />
        {{ isEditing ? "Cancel" : "Back" }}
      </j-button>
      <j-button
        style="width: 100%"
        full
        :disabled="isAddLink || !canCreateLink"
        :loading="isAddLink"
        size="lg"
        variant="primary"
        @click="createLink"
      >
        <j-icon slot="end" name="add" />
        {{ isEditing ? "Save" : "Add link" }}
      </j-button>
    </j-flex>
  </j-flex>
</template>

<script lang="ts">
import { ad4mClient } from "@/app";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { AREA_HAS_DESCRIPTION, AREA_HAS_IMAGES, AREA_HAS_NAME, AREA_SIMPLE_AREA, AREA_TYPE, FLUX_PROFILE, HAS_AREA } from "@/constants/profile";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { useUserStore } from "@/store/user";
import getAgentLinks from "@/utils/getAgentLinks";
import removeTypeName from "@/utils/removeTypeName";
import { useValidation } from "@/utils/validation";
import { Link, PerspectiveInput } from "@perspect3vism/ad4m";
import { nanoid } from "nanoid";
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: ["area", "isEditing"],
  emits: ["cancel", "submit", "changeStep"],
  setup() {
    const imgs = ref<string[]>([]);
    const description = ref("");
    const isAddLink = ref(false);

    const {
      value: title,
      error: titleError,
      errorMessage: titleErrorMessage,
      isValid: titleIsValid,
      validate: validateTitle,
    } = useValidation({
      initialValue: "",
      rules: [
        {
          check: (value: string) => (value ? false : true),
          message: "Title is required",
        },
        {
          check: (value: string) => value.length < 3,
          message: "Should be 3 or more characters",
        },
      ],
    });

    return {
      title,
      titleError,
      titleErrorMessage,
      titleIsValid,
      validateTitle,
      description,
      imgs,
      isAddLink,
    };
  },
  watch: {
    area: {
      handler: function (area) {
        this.title = area?.has_name ?? "";
        this.description = area?.has_description ?? "";
        this.imgs = area?.has_images ?? [];
      },
      immediate: true,
      deep: true,
    },
  },
  computed: {
    canCreateLink(): boolean {
      return this.titleIsValid;
    },
  },
  methods: {
    onFileClick() {
      document.getElementById("simpleAreaImgInput")?.click();
    },
    selectFile(e: any) {
      const files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;

      var reader = new FileReader();

      reader.onload = (e) => {
        const temp: any = e.target?.result;
        this.imgs.push(temp);
      };

      reader.readAsDataURL(files[0]);
    },
    async createLink() {
      this.isAddLink = true;
      const dataStore = useDataStore();
      const userStore = useUserStore();
      const appStore = useAppStore();
      const userPerspective = userStore.getAgentProfileProxyPerspectiveId;

      const did = userStore.getUser?.agent.did;

      const preLinks = await getAgentLinks(did!, userPerspective!);

      const preArea: { [x: string]: any } = {};

      preLinks.forEach((e: any) => {
        const predicate = e.data.predicate.split("://")[1];
        if (!preArea[e.data.source]) {
          preArea[e.data.source] = {
            [predicate]:
              predicate === "has_post"
                ? e.data.target
                : e.data.predicate.split("://")[1],
          };
        }

        preArea[e.data.source][predicate] = e.data.predicate.split("://")[1];
      });
      console.log("preLinks", preLinks);
      const id = await nanoid();

      let areaName = this.area?.id ?? `area://${id}`;

      if (!this.area?.id) {
        await ad4mClient.perspective.addLink(
          userPerspective!,
          new Link({
            source: FLUX_PROFILE,
            target: areaName,
            predicate: HAS_AREA,
          })
        );
      }

      if (this.area?.id) {
        const foundLinks = preLinks.filter(
          (e) => e.data.source === this.area?.id
        );

        for (const foundLink of foundLinks) {
          const link = removeTypeName(foundLink);
          await ad4mClient.perspective.removeLink(userPerspective!, link);
        }
      }

      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: areaName,
          target: AREA_SIMPLE_AREA,
          predicate: AREA_TYPE,
        })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: areaName,
          target: `text://${this.title}`,
          predicate: AREA_HAS_NAME,
        })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: areaName,
          target: `text://${this.description}`,
          predicate: AREA_HAS_DESCRIPTION,
        })
      );

      for (let index = 0; index < this.imgs.length; index++) {
        const element = this.imgs[index];
        const storedImage = await ad4mClient.expression.create(
          element,
          NOTE_IPFS_EXPRESSION_OFFICIAL
        );
        await ad4mClient.perspective.addLink(
          userPerspective!,
          new Link({
            source: areaName,
            target: storedImage,
            predicate: AREA_HAS_IMAGES,
          })
        );
      }

      const newLinks = await getAgentLinks(did!, userPerspective!);

      const links = [];
      //Remove __typename fields so the next gql does not fail
      for (const link in newLinks) {
        //Deep copy the object... so we can delete __typename fields inject by apollo client
        const newLink = JSON.parse(JSON.stringify(newLinks[link]));
        newLink.__typename = undefined;
        newLink.data.__typename = undefined;
        newLink.proof.__typename = undefined;
        links.push(newLink);
      }
      await ad4mClient.agent.updatePublicPerspective({
        links,
      } as PerspectiveInput);

      appStore.showSuccessToast({
        message: "Link added to agent perspective",
      });

      this.title = "";
      this.description = "";
      this.isAddLink = false;
      this.imgs = [];

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
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.close {
  position: absolute;
  top: -14px;
  right: -10px;
  background-color: var(--j-color-white);
}
</style>
