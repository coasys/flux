<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
      <avatar-upload
        :hash="userDid"
        :value="profilePicture"
        @change="(url) => (profilePicture = url)"
      ></avatar-upload>
      <j-input
        size="lg"
        label="Username"
        @keydown.enter="updateProfile"
        :value="userProfile?.username"
        @input="(e) => (username = e.target.value)"
      ></j-input>
      <div>
        <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
        <j-button size="lg" variant="primary" @click="updateProfile">
          Save
        </j-button>
      </div>
    </j-flex>
    <br />
    <j-flex direction="column" gap="700">
      <j-text>Edit agent perspective</j-text>
      <j-input
        size="lg"
        label="Add Link"
        :value="link"
        @input="(e) => (link = e.target.value)"
      ></j-input>
      <div>
        <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
        <j-button size="lg" variant="primary" @click="updateAgentPerspective">
          Update
        </j-button>
      </div>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { defineComponent } from "vue";
import { Profile } from "@/store/types";
import { useUserStore } from "@/store/user";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "@/core/methods/createProfile";
import { Link, PerspectiveInput } from "@perspect3vism/ad4m";
import { ad4mClient } from "@/app";
import { useAppStore } from "@/store/app";

export default defineComponent({
  emits: ["cancel", "submit"],
  components: { AvatarUpload },
  setup() {
    const userStore = useUserStore();
    const appStore = useAppStore();

    return {
      userStore,
      appStore,
    };
  },
  data() {
    return {
      isUpdatingProfile: false,
      profilePicture: "",
      username: "",
      link: "",
    };
  },
  computed: {
    userProfile(): Profile {
      return this.userStore.profile!;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
  },
  watch: {
    "userProfile.profilePicture": {
      handler: function (val: string): void {
        this.profilePicture = val;
      },
      immediate: true,
    },
    "userProfile.username": {
      handler: function (val: string): void {
        this.username = val;
      },
      immediate: true,
    },
  },
  methods: {
    async updateProfile() {
      this.isUpdatingProfile = true;
      const resizedImage = this.profilePicture
        ? await resizeImage(dataURItoBlob(this.profilePicture as string), 400)
        : undefined;
      const thumbnail = this.profilePicture
        ? await blobToDataURL(resizedImage!)
        : undefined;

      this.userStore
        .updateProfile({
          username: this.username,
          profilePicture: this.profilePicture,
          thumbnail,
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isUpdatingProfile = false;
        });
    },
    async updateAgentPerspective() {
      const userPerspective = this.userStore.getFluxPerspectiveId;
      await ad4mClient.perspective.addLink(
        userPerspective!,
        new Link({ source: "self", target: this.link, predicate: "post" })
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
      this.appStore.showSuccessToast({
        message: "Link added to agent perspective",
      });
    },
  },
});
</script>
