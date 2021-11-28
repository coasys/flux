<template>
  <j-flex direction="column" gap="400" v-if="step === 2" class="steps">
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
      <div v-for="(img, index) of imgs" :key="`${img}-${index}`" class="img_container">
        <div class="img_bg" :style="{background: `url(${img})`}"></div>
        <div class="close" @click="() => (imgs.splice(index, 1))">
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
        <j-button full style="width: 100%" size="lg" @click="$emit('changeStep', 1)">
          <j-icon slot="start" name="arrow-left-short" />
          Back
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
          Add link
        </j-button>
      </j-flex>
  </j-flex>
</template>

<script lang="ts">
import { ad4mClient } from "@/app";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { useUserStore } from "@/store/user";
import getAgentLinks from "@/utils/getAgentLinks";
import { useValidation } from "@/utils/validation";
import { Link, PerspectiveInput } from "@perspect3vism/ad4m";
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: ['step'],
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
      isAddLink
    };
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
      const userPerspective = userStore.getFluxPerspectiveId;

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
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: `flux://profile`,
          target: `area-${Object.keys(preArea).length}`,
          predicate: "flux://has_area",
        })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: `area-${Object.keys(preArea).length}`,
          target: `flux://simpleArea`,
          predicate: "flux://area_type",
        })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: `area-${Object.keys(preArea).length}`,
          target: `text://${this.title}`,
          predicate: "sioc://has_name",
        })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({
          source: `area-${Object.keys(preArea).length}`,
          target: `text://${this.description}`,
          predicate: "sioc://has_description",
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
            source: `area-${Object.keys(preArea).length}`,
            target: storedImage,
            predicate: `sioc://has_images`,
          })
        );
      }

      const newLinks = await getAgentLinks(did!, userPerspective!);

      const links = [];
      //Remove __typename fields so the next gql does not fail
      for (const link in newLinks) {
        //Deep copy the object... so we can delete __typename fields inject by apollo client
        const newLink = JSON.parse(
          JSON.stringify(newLinks[link])
        );
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
      this.$emit("changeStep", 1)
    },
  }
})
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
  top: -14px;
  right: -10px;
  background-color: var(--j-color-white);
}
</style>