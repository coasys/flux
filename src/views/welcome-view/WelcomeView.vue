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
            :type="showPassword ? 'text' : 'password'"
            :value="password"
            @keydown.enter="logIn"
            :error="passwordError"
            :errortext="passwordErrorMessage"
            @input="(e) => (password = e.target.value)"
          >
            <j-button
              @keydown.stop
              @click.stop="showPassword = !showPassword"
              variant="transparent"
              square
              slot="end"
            >
              <j-icon :name="showPassword ? 'eye-slash' : 'eye'" />
            </j-button>
          </j-input>
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
      <div v-else>
        <j-flex direction="column" gap="400" v-if="step === 1">
          <j-text variant="heading">Sign up</j-text>
          <j-input
            label="Username"
            size="lg"
            :value="username"
            @input="(e) => (username = e.target.value)"
            :error="usernameError"
            :errortext="usernameErrorMessage"
            @blur="(e) => validateUsername()"
          ></j-input>

          <j-input
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            size="lg"
            :value="password"
            @keydown.enter="step = 2"
            @input="(e) => (password = e.target.value)"
            :error="passwordError"
            :errortext="passwordErrorMessage"
            @blur="(e) => validatePassword()"
          >
            <j-button
              @keydown.stop
              @click.stop="showPassword = !showPassword"
              variant="transparent"
              square
              slot="end"
            >
              <j-icon :name="showPassword ? 'eye-slash' : 'eye'" />
            </j-button>
          </j-input>
          <j-button
            full
            size="lg"
            :disabled="!canSignUp"
            variant="primary"
            @click="step = 2"
          >
            Next
            <j-icon slot="end" name="arrow-right-short" />
          </j-button>
        </j-flex>
        <j-flex direction="column" gap="400" v-if="step === 2">
          <avatar-upload
            :value="profilePicture"
            @change="(url) => (profilePicture = url)"
          >
          </avatar-upload>
          <j-input
            label="First Name (optional)"
            :value="name"
            @input="(e) => (name = e.target.value)"
          ></j-input>
          <j-input
            label="Last Name (optional)"
            :value="familyName"
            @input="(e) => (familyName = e.target.value)"
          ></j-input>
          <j-input
            type="email"
            label="Email (optional)"
            :value="email"
            @input="(e) => (email = e.target.value)"
          ></j-input>
          <j-flex>
            <j-button full style="width: 100%" size="lg" @click="step = 1">
              <j-icon slot="start" name="arrow-left-short" />
              Back
            </j-button>
            <j-button
              style="width: 100%"
              full
              :disabled="isCreatingUser || !canSignUp"
              :loading="isCreatingUser"
              size="lg"
              variant="primary"
              @click="createUser"
            >
              <j-icon slot="end" name="check" />
              Create user
            </j-button>
          </j-flex>
        </j-flex>
      </div>
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
    const step = ref(1);
    const store = useStore();
    const profilePicture = ref();
    const modalOpen = ref(false);
    const isCreatingUser = ref(false);
    const isLoggingIn = ref(false);
    const showPassword = ref(false);

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
      step,
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
      showPassword,
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
        .then((data) => {
          const isUnlocked = data!.isUnlocked;
          if (isUnlocked) {
            this.$router.push("/");
          } else {
            this.password = "";
            this.passwordError = true;
            this.passwordErrorMessage = "Incorrect password";
          }
        })
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
