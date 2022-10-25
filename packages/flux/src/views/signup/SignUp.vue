<template>
  <div class="signup-view">
    <div class="signup-view__intro" v-if="!showSignup">
      <div>
        <j-box pb="700">
          <Logo class="signup-view__intro-logo" width="150px"></Logo>
        </j-box>

        <div class="signup-view__intro-extension">
          <j-box align="center">
            <j-text variant="heading">Get started with Flux</j-text>
          </j-box>
          <j-text>
            You need the AD4M extension to use Flux. By connecting to AD4M you
            are able to surf the internet completely decentralized.
          </j-text>
          <j-box class="signup-view__intro-button" pt="900">
            <j-button
              @click="() => $emit('connectToAd4m')"
              variant="primary"
              size="lg"
            >
              <Ad4mLogo width="25px" slot="start" />
              Connect with AD4M
            </j-button>
          </j-box>
        </div>
      </div>
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
          @input="(e) => (username = e.target.value)"
          :error="usernameError"
          :errortext="usernameErrorMessage"
          @blur="(e) => validateUsername()"
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
import { defineComponent, ref } from "vue";
import Carousel from "./SignUpCarousel.vue";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import { useValidation } from "@/utils/validation";
import { useUserStore } from "@/store/user";
import ad4mLogo from "@/assets/images/ad4mLogo.svg";
import {
  getAd4mClient,
  isConnected,
  onAuthStateChanged,
} from "@perspect3vism/ad4m-connect/dist/utils";
import {
  AD4M_PREDICATE_USERNAME,
  AD4M_PREDICATE_FIRSTNAME,
  AD4M_PREDICATE_LASTNAME,
} from "utils/constants/profile";

import Logo from "@/components/logo/Logo.vue";
import { mapLiteralLinks } from "utils/helpers/linkHelpers";
import { useAppStore } from "@/store/app";
import Ad4mLogo from "@/components/ad4m-logo/Ad4mLogo.vue";

export default defineComponent({
  name: "SignUp",
  components: {
    AvatarUpload,
    Carousel,
    Logo,
    Ad4mLogo,
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
    isConnected().then((connected) => {
      if (connected) {
        this.autoFillUser();
      }
    });
    onAuthStateChanged((status: string) => {
      if (status === "connected_with_capabilities") {
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

        const client = await getAd4mClient();

        const perspectives = await client.perspective.all();
        const ad4mAgentPerspective = perspectives.find(
          ({ name }) => name === "Agent Profile"
        );

        if (ad4mAgentPerspective) {
          const agentPers = await client.perspective.snapshotByUUID(
            ad4mAgentPerspective.uuid
          );

          const profile = mapLiteralLinks(agentPers?.links, {
            username: AD4M_PREDICATE_USERNAME,
            name: AD4M_PREDICATE_FIRSTNAME,
            familyName: AD4M_PREDICATE_LASTNAME,
          });
          this.username = profile.username || "";
          this.name = profile.name || "";
          this.familyName = profile.familyName || "";
        }
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
  height: 100vh;
  overflow-y: auto;
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
  overflow: hidden;
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
