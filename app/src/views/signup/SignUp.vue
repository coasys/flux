<template>
  <div class="signup-view">
    <div class="signup-view__intro" v-if="!showSignup">
      <SignUpCarousel></SignUpCarousel>
    </div>

    <div class="signup-view__flow" v-else>
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
          @input="(e: any) => (username = e.target.value)"
          :error="usernameError"
          :errortext="usernameErrorMessage"
          @blur="(e: any) => validateUsername()"
        ></j-input>
        <j-toggle
          style="width: 100%"
          full
          size="lg"
          variant="primary"
          @change="allowNotifications"
          >Allow Notifications</j-toggle
        >
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
  </div>
</template>

<script lang="ts">
import { ad4mConnect } from "@/ad4mConnect";
import { defineComponent, ref } from "vue";
import Carousel from "./SignUpCarousel.vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { useValidation } from "@/utils/validation";
import { useUserStore } from "@/store/user";
import ad4mLogo from "@/assets/images/ad4mLogo.svg";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import Logo from "@/components/logo/Logo.vue";
import { useAppStore } from "@/store/app";
import Ad4mLogo from "@/components/ad4m-logo/Ad4mLogo.vue";
import SignUpCarousel from "./SignUpCarousel.vue";
import getAd4mProfile from "utils/api/getAd4mProfile";
import Ad4mConnectUI from "@perspect3vism/ad4m-connect";

export default defineComponent({
  name: "SignUp",
  components: {
    AvatarUpload,
    Carousel,
    Logo,
    Ad4mLogo,
    SignUpCarousel,
  },
  setup() {
    const showSignup = ref(false);
    const profilePicture = ref();
    const modalOpen = ref(false);
    const isCreatingUser = ref(false);
    const isLoggingIn = ref(false);
    const showPassword = ref(false);
    const userStore = useUserStore();
    const appStore = useAppStore();

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
      ad4mLogo,
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
      appStore,
    };
  },
  async mounted() {
    ad4mConnect.addEventListener("authstatechange", async (e) => {
      if (ad4mConnect.authState === "authenticated") {
        this.autoFillUser();
      }
    });
  },
  computed: {
    canSignUp(): boolean {
      return this.usernameIsValid;
    },
  },
  methods: {
    async checkIfHasFluxProfile() {
      const client = await getAd4mClient();

      const { perspective } = await client.agent.me();

      const fluxLinksFound = perspective?.links.find((e) =>
        e.data.source.startsWith("flux://")
      );

      return fluxLinksFound ? true : false;
    },
    async autoFillUser() {
      try {
        const hasFluxProfile = await this.checkIfHasFluxProfile();
        if (hasFluxProfile) {
          this.$router.push("/home");
          return;
        }

        this.showSignup = true;

        const ad4mProfile = await getAd4mProfile();

        this.username = ad4mProfile.username || "";
        this.name = ad4mProfile.name || "";
        this.familyName = ad4mProfile.familyName || "";
      } catch (e) {
        console.log(e);
      }
    },
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
        .finally(async () => {
          this.isCreatingUser = false;
          this.appStore.changeNotificationState(true);
        });
    },
    //@ts-ignore
    async allowNotifications(value) {
      this.appStore.changeNotificationState(
        !this.appStore.notification.globalNotification
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.signup-view {
  margin: 0 auto;
  height: 100%;
}

.signup-view__flow {
  display: grid;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  align-content: center;
  padding: var(--j-space-1000);
}

.signup-view__intro {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  max-width: 800px;
  margin: 0 auto;
  align-items: center;
}

.signup-view__intro-content {
  width: 100%;
}

.signup-view__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--j-space-400);
}

.signup-view__intro-logo {
  margin: 0 auto;
  display: block;
}

.signup-view__intro-button {
  text-align: center;
}

.signup-view__intro-extension {
  padding-top: var(--j-space-800);
  text-align: center;
}

.signup-view__logo {
  margin-bottom: var(--j-space-600);
}
</style>
