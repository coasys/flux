<template>
  <div class="container">
    <j-flex direction="column" gap="400" v-if="step === 1" class="steps">
      <j-text variant="heading">Add a link to profile</j-text>
      <j-button full @click="() => selectLinkType('community')">Add Community</j-button>
      <j-button full @click="() => selectLinkType('channel')">Add Channel</j-button>
      <j-button full @click="() => selectLinkType('webLink')">Add a web link</j-button>
    </j-flex>
    <j-flex direction="column" gap="400" v-if="step === 2" class="steps">
      <j-text variant="heading">Add a link to profile</j-text>
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
        :error="descriptionError"
        :errorText="descriptionErrorMessage"
        @blur="(e) => validateDescription"
      ></j-input>
        <j-input
        label="Link"
        size="xl"
        :value="link"
        @input="(e) => (link = e.target.value)"
        :error="linkError"
        :errorText="linkErrorMessage"
        @blur="(e) => validateLink"
      ></j-input>
      <j-flex gap="400">
        <j-button full style="width: 100%" size="lg" @click="step = 1">
          <j-icon slot="start" name="arrow-left-short" />
          Back
        </j-button>
        <j-button
          style="width: 100%"
          full
          :disabled="isAddLink || !canAddLink"
          :loading="isAddLink"
          size="lg"
          variant="primary"
          @click="addLink"
        >
          <j-icon slot="end" name="add" />
          Add link
        </j-button>
      </j-flex>
    </j-flex>
  </div>
</template>

<script lang="ts">
import { ad4mClient } from "@/app";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { useUserStore } from "@/store/user";
import { useValidation } from "@/utils/validation";
import { Link, PerspectiveInput } from "@perspect3vism/ad4m";
import { LinkType } from "datocms-structured-text-utils";
import { ref } from "vue";
import { defineComponent } from "vue-demi";

type linkType = 'community' | 'channel' | 'webLink' | null;
export default defineComponent({
  setup() {
    const linkType = ref<linkType>(null);
    const step = ref(1);
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

    
    const {
      value: description,
      error: descriptionError,
      errorMessage: descriptionErrorMessage,
      isValid: descriptionIsValid,
      validate: validateDescription,
    } = useValidation({
      initialValue: "",
      rules: [
        {
          check: (value: string) => (value ? false : true),
          message: "Description is required",
        },
        {
          check: (value: string) => value.length < 3,
          message: "Should be 3 or more characters",
        },
      ],
    });

    // TODO: update validation rules for link
    const {
      value: link,
      error: linkError,
      errorMessage: linkErrorMessage,
      isValid: linkIsValid,
      validate: validateLink,
    } = useValidation({
      initialValue: "",
      rules: [
        {
          check: (value: string) => (value ? false : true),
          message: "link is required",
        },
        {
          check: (value: string) => value.length < 3,
          message: "Should be 3 or more characters",
        },
      ],
    });

    return {
      linkType,
      title,
      titleError,
      titleErrorMessage,
      titleIsValid,
      validateTitle,
      description,
      descriptionError,
      descriptionErrorMessage,
      descriptionIsValid,
      validateDescription,
      link,
      linkError,
      linkErrorMessage,
      linkIsValid,
      validateLink,
      step,
      isAddLink
    }
  },
  computed: {
    canAddLink(): boolean {
      return this.titleIsValid && this.descriptionIsValid && this.linkIsValid;
    },
  },
  methods: {
    async addLink() {
      this.isAddLink = true;
      const dataStore = useDataStore();
      const userStore = useUserStore();
      const appStore = useAppStore();
      const userPerspective = userStore.getFluxPerspectiveId;

      // @ts-ignore
      const { links: preLinks } = await ad4mClient.perspective.snapshotByUUID(
        userPerspective!
      );

      const preArea: {[x: string]: any} = {};

      preLinks.forEach((e: any) => {
        const predicate = e.data.predicate.split('://')[1];
        if (!preArea[e.data.source]) {
          preArea[e.data.source] = {
            [predicate]: predicate === 'has_post' ? e.data.target : e.data.predicate.split('://')[1],
          }
        }

        preArea[e.data.source][predicate] = e.data.predicate.split('://')[1];
      });
      console.log('preLinks', preLinks)
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: `area-${Object.keys(preArea).length}`, target: this.link, predicate: "sioc://has_post" })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: `area-${Object.keys(preArea).length}`, target: 'flux://community', predicate: "flux://area_type" })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: `area-${Object.keys(preArea).length}`, target: `text://${this.title}`, predicate: "sioc://has_name" })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: `area-${Object.keys(preArea).length}`, target: `text://${this.description}`, predicate: "sioc://has_description" })
      );
      const perspectiveSnapshot = await ad4mClient.perspective.snapshotByUUID(
        userPerspective!
      );
      const links = [];
      //Remove __typename fields so the next gql does not fail
      for (const link in perspectiveSnapshot!.links) {
        //Deep copy the object... so we can delete __typename fields inject by apollo client
        const newLink = JSON.parse(
          JSON.stringify(perspectiveSnapshot!.links[link])
        );
        newLink.__typename = undefined;
        newLink.data.__typename = undefined;
        newLink.proof.__typename = undefined;
        links.push(newLink);
      }
      await ad4mClient.agent.updatePublicPerspective({
        links,
      } as PerspectiveInput);
      this.link = "";
      appStore.showSuccessToast({
        message: "Link added to agent perspective",
      });
    },
    selectLinkType(type: linkType) {
      this.linkType = type;
      this.step = 2;
    }
  }
});
</script>

<style scoped>
.container {
  margin: 0 auto;
  height: 60vh;
  width: 100%;
  display: flex;
  align-content: center;
  padding: var(--j-space-1000);
}

.steps {
  width: 100%;
}
</style>