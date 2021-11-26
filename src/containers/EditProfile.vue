<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <j-text variant="heading-sm">Edit profile</j-text>
      <img-upload
        :value="profileBg"
        @change="(url) => (profileBg = url)"
      ></img-upload>
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
      <j-input
        size="lg"
        label="Bio"
        @keydown.enter="updateProfile"
        :value="bio"
        @input="(e) => (bio = e.target.value)"
      ></j-input>
      <div>
        <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
        <j-button size="lg" variant="primary" @click="updateProfile">
          Save
        </j-button>
      </div>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { defineComponent, ref } from "vue";
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
import ImgUpload from "@/components/img-upload/ImgUpload.vue";
import { NOTE_IPFS_EXPRESSION_OFFICIAL } from "@/constants/languages";
import getAgentLinks from "@/utils/getAgentLinks";

export default defineComponent({
  emits: ["cancel", "submit"],
  props: ["bg", "preBio"],
  components: { AvatarUpload, ImgUpload },
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
      bio: "",
      link: "",
      profileBg: "",
      profileBgChanged: false,
      bioChanged: false
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
    preBio() {
      this.bio = this.preBio;
    },
    bg() {
      this.profileBg = this.bg;
    },
    bio() {
      this.bioChanged = this.bio !== this.preBio;
    },
    profileBg() {
      this.profileBgChanged = this.profileBg !== this.bg;
    }
  },
  methods: {
    async updateProfile() {
      this.isUpdatingProfile = true;
      const resizedImage = this.profilePicture
        ? await resizeImage(dataURItoBlob(this.profilePicture as string), 100)
        : undefined;
      const thumbnail = this.profilePicture
        ? await blobToDataURL(resizedImage!)
        : undefined;

      const userPerspective = this.userStore.getFluxPerspectiveId;

      let filteredLinks = await getAgentLinks(this.userDid, userPerspective!);

      if (this.profileBgChanged) {
        filteredLinks = filteredLinks.filter(e => e.data.predicate !== 'sioc://has_image');
        const image = await ad4mClient.expression.create(
          this.profileBg,
          NOTE_IPFS_EXPRESSION_OFFICIAL
        );

        const profileBgLinked = await ad4mClient.perspective.addLink(
          userPerspective!,
          new Link({
            source: "flux://profile",
            target: `image://${image}`,
            predicate: "sioc://has_image",
          })
        );

        filteredLinks.push(profileBgLinked)
      }


      if (this.bioChanged) {
        filteredLinks = filteredLinks.filter(e => e.data.predicate !== 'sioc://has_bio');

        const linked = await ad4mClient.perspective.addLink(
          userPerspective!,
          new Link({
            source: "flux://profile",
            target: `text://${this.bio}`,
            predicate: "sioc://has_bio",
          })
        );

        filteredLinks.push(linked)
      }

      const links = [];
      //Remove __typename fields so the next gql does not fail
      for (const link of filteredLinks) {
        //Deep copy the object... so we can delete __typename fields inject by apollo client
        const newLink = JSON.parse(JSON.stringify(link));
        newLink.__typename = undefined;
        newLink.data.__typename = undefined;
        newLink.proof.__typename = undefined;

        links.push(newLink);
      }
      const agent = await ad4mClient.agent.updatePublicPerspective({
        links,
      } as PerspectiveInput);

      this.userStore
        .updateProfile({
          username: this.username,
          profilePicture: this.profilePicture,
          thumbnail,
          bio: this.bio,
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isUpdatingProfile = false;
        });
    },
  },
});
</script>

<style scoped>
.profile_bg {
  width: 100%;
  height: 100px;
}
</style>
