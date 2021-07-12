<template>
  <div class="signup-view">
    <div class="signup-view__intro" v-if="showIntro">
      <j-flex gap="800" direction="column">
        <Carousel />
        <j-button @click="showIntro = false" variant="primary" size="xl">
          Create an agent
        </j-button>
      </j-flex>
    </div>
    <div class="signup-view__flow" v-else>
      <j-flex direction="column" gap="400" v-if="step === 1">
        <j-text style="text-align: center" variant="heading-lg"
          >Create an agent</j-text
        >
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
import { useStore } from "vuex";
import { useValidation } from "@/utils/validation";

export default defineComponent({
  name: "Welcome",
  components: {
    AvatarUpload,
    Carousel,
  },
  setup() {
    const showIntro = ref(true);
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
      showIntro,
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
  },
});
</script>

<style lang="scss" scoped>
.signup-view {
  margin: 0 auto;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signup-view__intro {
  width: 100%;
  max-width: 100%;
  text-align: center;
}

.signup-view__flow {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
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
