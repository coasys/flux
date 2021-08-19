<template>
  <div class="signup-view" :class="{ 'signup-view--show-signup': showSignup }">
    <div class="signup-view__flow">
      <j-flex direction="column" gap="400" v-if="step === 1">
        <j-box class="signup-view__flow-back" pb="500">
          <j-button @click="showSignup = false" variant="link"
            ><j-icon name="arrow-left-short" />Back</j-button
          >
        </j-box>
        <j-box pb="500">
          <j-flex gap="400" a="center">
            <img src="@/assets/images/junto_web_logo--rainbow.png" width="25" />
            <j-text size="800" color="ui-800" uppercase nomargin>
              Junto
            </j-text>
          </j-flex>
        </j-box>
        <j-text variant="heading"> Create a user </j-text>
        <j-input
          label="Username"
          size="xl"
          :value="username"
          @input="(e) => (username = e.target.value)"
          :error="usernameError"
          :errortext="usernameErrorMessage"
          @blur="(e) => validateUsername()"
        ></j-input>

        <j-input
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          size="xl"
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
          size="xl"
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
    <div class="signup-view__intro">
      <div class="signup-view__intro-content">
        <Carousel />
        <j-box
          class="signup-view__intro-button"
          @click="showSignup = true"
          pt="900"
        >
          <j-button variant="primary" size="xl"> Sign up </j-button>
        </j-box>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import Carousel from "./SignUpCarousel.vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "@/core/methods/createProfile";
import { useValidation } from "@/utils/validation";
import { useUserStore } from "@/store/user";

export default defineComponent({
  name: "Welcome",
  components: {
    AvatarUpload,
    Carousel,
  },
  setup() {
    const showSignup = ref(false);
    const step = ref(1);
    const profilePicture = ref();
    const modalOpen = ref(false);
    const isCreatingUser = ref(false);
    const isLoggingIn = ref(false);
    const showPassword = ref(false);
    const userStore = useUserStore();

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
      showSignup,
      isLoggingIn,
      profilePicture,
      hasUser: userStore.agent.isInitialized,
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
      userStore
    };
  },
  computed: {
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

      this.userStore
        .createUser({
          givenName: this.name,
          familyName: this.familyName,
          email: this.email,
          username: this.username,
          password: this.password,
          profilePicture: this.profilePicture,
          thumbnailPicture: this.profilePicture,
        })
        .then(() => this.$router.push("/"))
        .finally(() => {
          this.isCreatingUser = false;
        });
    },
  },
});
</script>

<style lang="scss" scoped>
.signup-view {
  margin: 0 auto;
  height: 100vh;
  display: flex;
}

.signup-view__flow {
  display: none;
  width: 100%;
  height: 100%;
  align-content: center;
  padding: var(--j-space-1000);
}

.signup-view--show-signup .signup-view__flow {
  display: grid;
}

.signup-view--show-signup .signup-view__intro {
  display: none;
}

.signup-view__intro {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  background: var(--j-color-primary-50);
  overflow: hidden;
  text-align: center;
}

@media (min-width: 1100px) {
  .signup-view__flow {
    display: grid;
  }
  .signup-view--show-signup .signup-view__flow {
    display: grid;
  }
  .signup-view__intro {
    display: flex;
  }
  .signup-view--show-signup .signup-view__intro {
    display: flex;
  }
  .signup-view__intro-button {
    display: none;
  }
  .signup-view__flow-back {
    display: none;
  }
}

@media (min-width: 1100px) {
  .signup-view__flow {
    width: 40%;
  }

  .signup-view__intro {
    width: 60%;
  }
}

.signup-view__intro-content {
  width: 100%;
}

.signup-view__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--j-space-400);
}

.signup-view__logo {
  margin-bottom: var(--j-space-600);
}
</style>
