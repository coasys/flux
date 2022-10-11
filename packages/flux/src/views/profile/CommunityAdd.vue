<template>
  <j-flex direction="column" gap="400" class="steps">
    <j-text variant="heading">Add a link to profile</j-text>
    <j-input
      label="Neighbourhood link"
      size="xl"
      :value="link"
      @input="(e) => (link = e.target.value)"
      :error="linkError"
      :errorText="linkErrorMessage"
      @blur="addLink"
      :loading="isAddLink"
      variant="primary"
    ></j-input>

    <j-flex gap="500" a="center">
      <avatar-upload
        size="4rem"
        :value="newProfileImage"
        @change="(val) => (newProfileImage = val)"
        icon="camera"
      />
      <j-flex style="width: 100%" direction="column" gap="300">
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
      </j-flex>
    </j-flex>
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
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "utils/constants/languages";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { useUserStore } from "@/store/user";
import getAgentLinks from "utils/api/getAgentLinks";
import { useValidation } from "@/utils/validation";
import { Link, PerspectiveInput } from "@perspect3vism/ad4m";
import { defineComponent, ref } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import removeTypeName from "utils/helpers/removeTypeName";
import { nanoid } from "nanoid";
import { AREA_COMMUNITY, HAS_AREA } from "utils/constants/profile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export default defineComponent({
  props: ["area", "isEditing"],
  emits: ["cancel", "submit"],
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
        {
          check: (value: string) => !value.startsWith("neighbourhood://"),
          message: "Please add a valid neighbourhood link",
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
  watch: {
    area: {
      handler: function (area) {
        this.title = area?.has_name ?? "";
        this.description = area?.has_description ?? "";
        this.link = area?.has_post ?? "";
        this.newProfileImage = area?.has_image ?? "";
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    async createLink() {
      const client = await getAd4mClient();
      if (this.canCreateLink && !this.isAddLink) {
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

        let area = {
          id: areaName,
          link: this.link,
          type: AREA_COMMUNITY,
          name: this.title,
          description: this.description,
          image: null
        }

        if (this.area?.id) {
          const foundLinks = preLinks.filter(
            (e) => e.data.source === this.area?.id
          );

          for (const foundLink of foundLinks) {
            const link = removeTypeName(foundLink);
            await client.perspective.removeLink(userPerspective!, link);
          }
        }

        const community = dataStore.getCommunities.find(
          (e) => e.neighbourhood.neighbourhoodUrl === this.link
        );
        const image = this.newProfileImage || community?.neighbourhood.image;

        if (image) {
          const storedImage = await client.expression.create(
            image,
            NOTE_IPFS_EXPRESSION_OFFICIAL
          );
          area.image = storedImage;
        }

        
        const literal = await client.expression.create(area, 'literal');

        await client.perspective.addLink(userPerspective!, {
          source: areaName,
          predicate: HAS_AREA,
          target: literal
        })

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
        await client.agent.updatePublicPerspective({
          links,
        } as PerspectiveInput);
        // await client.perspective.remove()
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
      }
    },
    addLink() {
      this.validateLink();

      const dataStore = useDataStore();
      const community = dataStore.getCommunities.find(
        (e) => e.neighbourhood.neighbourhoodUrl === this.link
      );
      console.log(community);
      if (!this.area) {
        this.title = community?.neighbourhood.name as string;
        this.description = community?.neighbourhood.description as string;
        this.newProfileImage = community?.neighbourhood.image as string;
      }
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
