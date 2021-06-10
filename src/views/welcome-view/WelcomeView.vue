<template>
  <div class="welcome-view">
    <div class="welcome-view__left">
      <div class="welcome-view__logo">
        <img
          width="100"
          src="@/assets/images/junto_web_logo--rainbow.png"
          alt=""
        />
      </div>
      <j-text variant="heading-lg">JUNTO</j-text>
      <j-text variant="ingress">
        Welcome to the next generation of social media.
      </j-text>
      <j-text variant="body" v-if="!hasUser">
        Submitting user information will register you in the public Junto
        network but this is not required to use private groups.
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
          <j-button
            :loading="isLoggingIn"
            full="false"
            size="lg"
            variant="primary"
            @click="logIn"
          >
            Login
          </j-button>
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
          label="Username"
          :value="username"
          @input="(e) => (username = e.target.value)"
          :error="usernameError"
          :errortext="usernameErrorMessage"
          @blur="(e) => validateUsername()"
        ></j-input>

        <j-input
          type="password"
          label="Password"
          :value="password"
          @keydown.enter="createUser"
          @input="(e) => (password = e.target.value)"
          :error="passwordError"
          :errortext="passwordErrorMessage"
          @blur="(e) => validatePassword()"
        ></j-input>
        <j-input
          label="First Name"
          :value="name"
          @input="(e) => (name = e.target.value)"
          helptext="(optional)"
        ></j-input>
        <j-input
          label="Last Name"
          :value="familyName"
          @input="(e) => (familyName = e.target.value)"
          helptext="(optional)"
        ></j-input>
        <j-input
          type="email"
          label="Email"
          :value="email"
          @input="(e) => (email = e.target.value)"
          helptext="(optional)"
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
import { useValidation } from "@/utils/validation";

export default defineComponent({
  name: "Welcome",
  setup() {
    const store = useStore();
    const profilePicture = ref();
    const modalOpen = ref(false);
    const isCreatingUser = ref(false);
    const isLoggingIn = ref(false);

    const {
      value: username,
      error: usernameError,
      errorMessage: usernameErrorMessage,
      isValid: usernameIsValid,
      validate: validateUsername,
    } = useValidation({
      initialValue: "",
      rules: [
        {
          check: (value: string) => (value ? false : true),
          message: "Username is required",
        },
        {
          check: (value: string) => value.length < 3,
          message: "Should be 3 or more characters",
        },
      ],
    });

    const {
      value: password,
      error: passwordError,
      errorMessage: passwordErrorMessage,
      isValid: passwordIsValid,
      validate: validatePassword,
    } = useValidation({
      initialValue: "",
      rules: [
        {
          check: (value: string) => value.length < 8,
          message: "Password should be 8 or more characters",
        },
        {
          check: (value: string) =>
            !(/[a-zA-Z]/.test(value) && /[0-9]/.test(value)),
          message:
            "Password should be 8 or more characters and contain at least one number",
        },
      ],
    });

    const name = ref("");

    const familyName = ref("");

    const email = ref("");

    const logInError = ref(false);

    return {
      isLoggingIn,
      profilePicture,
      hasUser: store.state.agentInit,
      modalOpen,
      isCreatingUser,
      name,
      username,
      usernameError,
      usernameErrorMessage,
      usernameIsValid,
      validateUsername,
      password,
      passwordError,
      passwordErrorMessage,
      passwordIsValid,
      validatePassword,
      email,
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
      return this.usernameIsValid && this.passwordIsValid;
    },
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
      this.isLoggingIn = true;
      this.$store
        .dispatch("logIn", {
          password: this.password,
        })
        .then(() => this.$router.push("/"))
        .finally(() => {
          this.isLoggingIn = false;
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
