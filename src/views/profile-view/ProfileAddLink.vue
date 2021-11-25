<template>
  <div class="container">
    <j-flex direction="column" gap="400" v-if="step === 1" class="steps">
      <j-text variant="heading">Add a link to profile</j-text>
      <j-button full @click="() => selectLinkType('community')">Add Community</j-button>
      <j-button full @click="() => selectLinkType('webLink')">Add a web link</j-button>
    </j-flex>
    <j-flex direction="column" gap="400" v-if="step === 2" class="steps">
      <j-text variant="heading">Add a link to profile</j-text>
        <j-input
          :label="linkType === 'community' ? 'Neighbourhood link' : 'Web link'"
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
            Next
            <j-icon slot="end" name="arrow-right-short" />
          </j-button>
    </j-flex>
    </j-flex>
    <j-flex direction="column" gap="400" v-if="step === 3" class="steps">
      <j-text variant="heading">Add a link to profile</j-text>
      <avatar-upload
        :value="newProfileImage"
        @change="(val) => (newProfileImage = val)"
        icon="camera"
      />
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
      <j-flex gap="400">
        <j-button full style="width: 100%" size="lg" @click="step = 1">
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
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";

type linkType = 'community' | 'channel' | 'webLink' | null;
export default defineComponent({
  emits: ["cancel", "submit"],
  setup() {
    const linkType = ref<linkType>(null);
    const step = ref(1);
    const isAddLink = ref(false);
    const newProfileImage = ref("");

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
      isAddLink,
      newProfileImage
    }
  },
  computed: {
    canAddLink(): boolean {
      return this.linkIsValid;
    },
    canCreateLink(): boolean {
      return this.titleIsValid && this.descriptionIsValid
    }
  },
  methods: {
    async createLink() {
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
        new Link({ source: `area-${Object.keys(preArea).length}`, target: `flux://${this.linkType}`, predicate: "flux://area_type" })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: `area-${Object.keys(preArea).length}`, target: `text://${this.title}`, predicate: "sioc://has_name" })
      );
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: `area-${Object.keys(preArea).length}`, target: `text://${this.description}`, predicate: "sioc://has_description" })
      );


      if (this.linkType === 'community') {
        const community = dataStore.getCommunities.find(e => e.neighbourhood.neighbourhoodUrl === this.link);
        console.log(community)
        const image = this.newProfileImage || community?.neighbourhood.image;

        if (image) {          
          await ad4mClient.perspective.addLink(
            userPerspective!,
            new Link({ source: `area-${Object.keys(preArea).length}`, target: `image://${image}`, predicate: "sioc://has_image" })
          );
        }

      } else if (this.linkType === 'webLink' && this.newProfileImage) {
        await ad4mClient.perspective.addLink(
          userPerspective!,
          new Link({ source: `area-${Object.keys(preArea).length}`, target: `image://${this.newProfileImage}`, predicate: "sioc://has_image" })
        );
      }

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

      this.step = 1;
      this.title = "";
      this.description = "";
      this.link = "";
      this.newProfileImage = "";

      this.$emit("submit");
    },
    selectLinkType(type: linkType) {
      this.linkType = type;
      this.step = 2;
    },
    addLink() {
      this.validateLink();
      this.step = 3;
      if (this.linkType === 'community') {
        const dataStore = useDataStore();
        const community = dataStore.getCommunities.find(e => e.neighbourhood.neighbourhoodUrl === this.link);
        console.log(community)
        this.title = community?.neighbourhood.name as string;
        this.description = community?.neighbourhood.description as string;
        this.newProfileImage = community?.neighbourhood.image as string;
      }
    }
  },
  components: { AvatarUpload },
});
</script>

<style scoped>
.container {
  margin: 0 auto;
  min-height: 300px;
  max-height: 800px;
  height: 100%;
  width: 100%;
  display: flex;
  align-content: center;
  padding: var(--j-space-1000);
}

.steps {
  width: 100%;
}
</style>