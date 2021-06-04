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
          <avatar-upload
            :value="profileImage"
            @change="(url) => (profileImage = url)"
          >
          </avatar-upload>
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
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
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
  } {
    return {
      profileImage: null,
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
  },
  components: {
    AvatarUpload,
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
</style>
