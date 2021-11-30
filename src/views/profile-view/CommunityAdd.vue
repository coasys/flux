<template>
  <j-flex direction="column" gap="400" v-if="step === 2" class="steps">
    <j-text variant="heading">Add a link to profile</j-text>
    <j-input
      label="Neighbourhood link"
      size="xl"
      :value="link"
      @input="(e) => (link = e.target.value)"
      :error="linkError"
      :errorText="linkErrorMessage"
      @blur="(e) => validateLink"
    ></j-input>
    <j-flex gap="400">
      <j-button full style="width: 100%" size="lg" @click="$emit('changeStep', 1)">
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
      @keydown.enter="createLink"
    ></j-input>
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
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";

export default defineComponent({
  props: ['step'],
  emits: ["cancel", "submit", "changeStep"],
  components: {
    AvatarUpload, 
  },
  setup() {
    const isAddLink = ref(false);
    const newProfileImage = ref("");
    const description = ref("");

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
      title,
      titleError,
      titleErrorMessage,
      titleIsValid,
      validateTitle,
      description,
      link,
      linkError,
      linkErrorMessage,
      linkIsValid,
      validateLink,
      isAddLink,
      newProfileImage,
    };
  },
  computed: {
    canCreateLink(): boolean {
      return this.titleIsValid;
    },
    canAddLink(): boolean {
      return this.linkIsValid;
    },
  },
  methods: {
    async createLink() {
      if (this.canCreateLink && !this.isAddLink) {
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
            target: this.link,
            predicate: "sioc://has_post",
          })
        );
        await ad4mClient.perspective.addLink(
          userPerspective!,
          new Link({
            source: `area-${Object.keys(preArea).length}`,
            target: `flux://community`,
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
  
        const community = dataStore.getCommunities.find(
          (e) => e.neighbourhood.neighbourhoodUrl === this.link
        );
        console.log(community);
        const image = this.newProfileImage || community?.neighbourhood.image;
  
        const storedImage = await ad4mClient.expression.create(
          image,
          NOTE_IPFS_EXPRESSION_OFFICIAL
        );
  
        if (image) {
          await ad4mClient.perspective.addLink(
            userPerspective!,
            new Link({
              source: `area-${Object.keys(preArea).length}`,
              target: storedImage,
              predicate: "sioc://has_image",
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
        // await ad4mClient.perspective.remove()
        this.link = "";
        appStore.showSuccessToast({
          message: "Link added to agent perspective",
        });
  
        this.title = "";
        this.description = "";
        this.link = "";
        this.newProfileImage = "";
        this.isAddLink = false;
  
        this.$emit("submit");
        this.$emit("changeStep", 1)
      }
    },
    addLink() {
      this.validateLink();
      this.$emit("changeStep", 3)

      const dataStore = useDataStore();
      const community = dataStore.getCommunities.find(
        (e) => e.neighbourhood.neighbourhoodUrl === this.link
      );
      console.log(community);
      this.title = community?.neighbourhood.name as string;
      this.description = community?.neighbourhood.description as string;
      this.newProfileImage = community?.neighbourhood.image as string;
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
  top: 0;
  left: 0;
}

.steps {
  width: 100%;
}
</style>