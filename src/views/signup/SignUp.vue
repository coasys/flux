<template>
  <div class="signup-view" :class="{ 'signup-view--show-signup': showSignup }">
    <div class="signup-view__flow">
      <j-flex direction="column" gap="400">
        <j-box class="signup-view__flow-back" pb="500">
          <j-button @click="showSignup = false" variant="link">
            <j-icon name="arrow-left-short" />
            Back
          </j-button>
        </j-box>

        <j-box pb="800">
          <Logo width="150px" />
        </j-box>

        <j-text variant="heading"> Create a user </j-text>

        <avatar-upload
          icon="camera"
          :value="profilePicture"
          @change="(url) => (profilePicture = url)"
        >
        </avatar-upload>
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
          size="lg"
          label="First Name (optional)"
          :value="name"
          @input="(e) => (name = e.target.value)"
        ></j-input>
        <j-input
          size="lg"
          label="Last Name (optional)"
          :value="familyName"
          @input="(e) => (familyName = e.target.value)"
        ></j-input>
        <j-input
          size="lg"
          type="email"
          label="Email (optional)"
          :value="email"
          @input="(e) => (email = e.target.value)"
        ></j-input>
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
import { defineComponent, ref, watch } from "vue";
import Carousel from "./SignUpCarousel.vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { useValidation } from "@/utils/validation";
import { useUserStore } from "@/store/user";

import Logo from "@/components/logo/Logo.vue";

export default defineComponent({
  name: "SignUp",
  components: {
    AvatarUpload,
    Carousel,
    Logo,
  },
  setup() {
    const showSignup = ref(true);
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

    const name = ref("");

    const familyName = ref("");

    const email = ref("");

    const logInError = ref(false);

    return {
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
      showPassword,
      email,
      familyName,
      logInError,
      userStore,
    };
  },
  computed: {
    canSignUp(): boolean {
      return this.usernameIsValid;
    },
  },
  methods: {
    async createUser() {
      this.isCreatingUser = true;

      this.userStore
        .createUser({
          givenName: this.name,
          familyName: this.familyName,
          email: this.email,
          username: this.username,
          profilePicture: this.profilePicture,
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
  background: var(--j-color-ui-50);
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
