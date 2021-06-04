<template>
  <div class="welcome-view">
    <div class="welcome-view__left">
      <div class="welcome-view__logo">
        <img
          width="100"
          src="../../assets/images/junto_web_logo--rainbow.png"
          alt=""
        />
      </div>
      <j-text variant="heading-lg">JUNTO</j-text>
      <j-text variant="ingress">
        Welcome to the next generation of social media.
      </j-text>
      <j-text variant="body">
        Submitting user information will register you in the public junto DNA
        but this is not required to use private groups.
      </j-text>
    </div>
    <div class="welcome-view__right">
      <div v-if="hasUser">
        <j-text variant="heading">Welcome back</j-text>
        <j-flex direction="column" gap="400">
          <j-input
            size="lg"
            label="Password"
            type="password"
            :value="password"
            @keydown.enter="logIn"
            @input="(e) => (password = e.target.value)"
          ></j-input>
          <j-button full="false" size="lg" variant="primary" @click="logIn"
            >Login
          </j-button>
          <j-text v-if="logInError">Something wrong happended</j-text>
        </j-flex>
      </div>
      <j-flex direction="column" gap="400" v-else>
        <j-text variant="heading">Sign up</j-text>
        <div class="welcome-view--center">
          <profile-avatar
            :diameter="10"
            :enableFileSelection="true"
            :onClick="selectFile"
            :profileImage="profileImage"
          >
          </profile-avatar>
        </div>
        <j-input
          label="First Name"
          :value="name"
          @input="(e) => (name = e.target.value)"
        ></j-input>
        <j-input
          label="Last Name"
          :value="familyName"
          @input="(e) => (familyName = e.target.value)"
        ></j-input>
        <j-input
          label="Username"
          :value="username"
          @input="(e) => (username = e.target.value)"
        ></j-input>
        <j-input
          type="email"
          label="Email"
          :value="email"
          @input="(e) => (email = e.target.value)"
        ></j-input>
        <j-input
          type="password"
          label="Password"
          :value="password"
          @keydown.enter="logIn"
          @input="(e) => (password = e.target.value)"
        ></j-input>
        <j-button size="lg" full="true" variant="primary" @click="createUser">
          Create
        </j-button>
      </j-flex>
    </div>
  </div>

  <div class="cropper_parent" v-if="tempProfileImage !== null">
    <cropper
      ref="cropper"
      class="cropper"
      backgroundClass="cropper__background"
      :src="tempProfileImage"
      :stencil-props="{
        aspectRatio: 12 / 12,
      }"
    ></cropper>
    <div class="cropper_parent__btns">
      <button class="cropper_parent__btn" @click="clearImage">cancel</button>
      <button class="cropper_parent__btn" @click="selectImage">submit</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import {
  INITIALIZE_AGENT,
  AGENT_SERVICE_STATUS,
  UNLOCK_AGENT,
  LOCK_AGENT,
  ADD_PERSPECTIVE,
} from "../../core/graphql_queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import ad4m from "@perspect3vism/ad4m-executor";
import { databasePerspectiveName } from "../../core/juntoTypes";
import ProfileAvatar from "@/components/ui/avatar/ProfileAvatar.vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "@/core/methods/createProfile";
import { useStore } from "vuex";

export default defineComponent({
  name: "Welcome",
  setup() {
    const store = useStore();
    const modalOpen = ref(false);
    const name = ref("");
    const familyName = ref("");
    const username = ref("");
    const email = ref("");
    const password = ref("");
    const logInError = ref(false);

    return {
      hasUser: store.state.agentInit,
      modalOpen,
      name,
      username,
      email,
      password,
      familyName,
      logInError,
    };
  },
  computed: {
    isInit(): boolean {
      const isInit = this.$store.getters.getAgentInitStatus;
      return isInit.value;
    },
  },
  data(): {
    profileImage: string | ArrayBuffer | null | undefined;
    tempProfileImage: any;
  } {
    return {
      profileImage: null,
      tempProfileImage: null,
    };
  },
  methods: {
    async createUser() {
      const resizedImage = this.profileImage
        ? await resizeImage(dataURItoBlob(this.profileImage as string), 400)
        : null;
      const thumbnail = this.profileImage
        ? await blobToDataURL(resizedImage!)
        : null;

      this.$store
        .dispatch("createUser", {
          givenName: this.name,
          familyName: this.familyName,
          email: this.email,
          username: this.username,
          password: this.password,
          profilePicture: this.profileImage,
          thumbnailPicture: thumbnail,
        })
        .then(() => this.$router.push("/"));
    },
    logIn() {
      this.$store
        .dispatch("logIn", {
          password: this.password,
        })
        .then(() => this.$router.push("/"))
        .catch(() => {
          this.logInError = true;
        });
    },
    selectFile(e: any) {
      const files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;

      var reader = new FileReader();

      reader.onload = (e) => {
        this.tempProfileImage = e.target?.result;
      };

      reader.readAsDataURL(files[0]);
    },
    clearImage() {
      this.tempProfileImage = null;
    },
    selectImage() {
      const result = (this.$refs.cropper as any).getResult();
      this.profileImage = result.canvas.toDataURL();
      this.tempProfileImage = null;
    },
  },
  components: {
    ProfileAvatar,
    Cropper,
  },
});
</script>

<style lang="scss" scoped>
.welcome-view {
  padding-left: var(--j-space-900);
  padding-right: var(--j-space-900);
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  gap: var(--j-space-500);
  display: grid;
  place-content: center;
  grid-template-columns: 1fr;

  &--center {
    align-self: center;
  }
}

@media (min-width: 800px) {
  .welcome-view {
    gap: var(--j-space-1000);
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}

.welcome-view__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--j-space-400);
}

.welcome-view__logo {
  margin-bottom: var(--j-space-600);
}

.cropper_parent {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
  background: black;
  display: flex;
  flex-direction: column;
  border-radius: 4px;

  &__btns {
    display: flex;
    width: 100%;
  }

  &__btn {
    height: 40px;
    width: 50%;
    font-size: 18px;
    background: white;

    &:hover {
      background: rgb(235, 235, 235);
      transition: all 0.2s;
    }
  }
}

.cropper {
  flex-grow: 1;
  &__background {
    background: transparent !important;
  }
}
</style>
