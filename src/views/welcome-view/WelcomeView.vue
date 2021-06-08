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
            :value="profilePicture"
            @change="(url) => (profilePicture = url)"
          >
          </avatar-upload>
        </div>
        <j-input
          label="First Name"
          :value="name"
          @input="(e) => (name = e.target.value)"
          help-text="(optional)"
        ></j-input>
        <j-input
          label="Last Name"
          :value="familyName"
          @input="(e) => (familyName = e.target.value)"
          help-text="(optional)"
        ></j-input>
        <j-input
          label="Username"
          :value="username"
          @input="(e) => (username = e.target.value)"
          required=""
          :error-text="usernameError"
          :error="usernameError !== null && usernameError?.length !== 0"
        ></j-input>
        <j-input
          type="email"
          label="Email"
          :value="email"
          @input="(e) => (email = e.target.value)"
          help-text="(optional)"
        ></j-input>
        <j-input
          type="password"
          label="Password"
          :value="password"
          @keydown.enter="createUser"
          @input="(e) => (password = e.target.value)"
          required=""
          :error-text="passwordError"
          :error="passwordError !== null && passwordError?.length !== 0 "
        ></j-input>
        <j-button
          :disabled="isCreatingUser || !canSignUp"
          :loading="isCreatingUser"
          size="lg"
          full="true"
          variant="primary"
          @click="createUser"
        >
          Create
        </j-button>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
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
    const isCreatingUser = ref(false);
    const name = ref("");
    const familyName = ref("");
    const username = ref("");
    const email = ref("");
    const password = ref("");
    const logInError = ref(false);

    return {
      hasUser: store.state.agentInit,
      modalOpen,
      isCreatingUser,
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
    canSignUp(): boolean {
      return this.usernameError === null && this.passwordError === null;
    }
  },
  data(): {
    profilePicture: string | ArrayBuffer | null | undefined;
    usernameError: string | null;
    passwordError: string | null;
  } {
    return {
      profilePicture: null,
      usernameError: "",
      passwordError: "",
    };
  },
  watch: {
    username() {
      if (this.username.length < 3) {
        this.usernameError = "Username must be three characters long";
      } else {
        this.usernameError = null;
      }
    },
    password() {
      if (this.password.length < 8) {
        this.passwordError = "Password must be eight characters long";
      } else if(!(/[a-zA-Z]/.test(this.password) && /[0-9]/.test(this.password))) {
        this.passwordError = "Password must contain atleast one number and be 8 charactes long";
      } else {
        this.passwordError = null;
      }
    }
  },
  methods: {
    async createUser() {
      const resizedImage = this.profilePicture
        ? await resizeImage(dataURItoBlob(this.profilePicture as string), 400)
        : null;
      const thumbnail = this.profilePicture
        ? await blobToDataURL(resizedImage!)
        : null;

      this.isCreatingUser = true;

      this.$store
        .dispatch("createUser", {
          givenName: this.name,
          familyName: this.familyName,
          email: this.email,
          username: this.username,
          password: this.password,
          profilePicture: this.profilePicture,
          thumbnailPicture: thumbnail,
        })
        .then(() => this.$router.push("/"))
        .finally(() => {
          this.isCreatingUser = false;
        });
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
