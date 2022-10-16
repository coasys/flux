<template>
  <div class="signup-view">
    <div class="signup-view__intro" v-if="!showSignup">
      <j-box pt="1000" p="300">
        <Logo class="logo" width="150px"></Logo>
      </j-box>
      <Carousel />
      <j-box
        class="signup-view__intro-button"
        @click="showSignup = true"
        pt="900"
      >
        <j-button
          @click="() => $emit('showConnect')"
          variant="primary"
          size="xl"
        >
          Sign up
        </j-button>
      </j-box>
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

export default defineComponent({
  name: "SignUp",
  components: {
    AvatarUpload,
    Carousel,
    Logo,
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
    const connected = await isConnected();
    if (connected) {
      this.autoFillUser();
    } else {
      onAuthStateChanged((status: string) => {
        if (status === "connected_with_capabilities") {
          this.autoFillUser();
        }
      });
    }
  },
  computed: {
    canSignUp(): boolean {
      return this.usernameIsValid;
    },
  },
  methods: {
    async autoFillUser() {
      try {
        const client = await getAd4mClient();

        const me = await client.agent.me();

        if (me.perspective) {
          const agentPerspectiveLinks = me.perspective.links;
          const profile = mapLiteralLinks(agentPerspectiveLinks, {
            username: AD4M_PREDICATE_USERNAME,
            name: AD4M_PREDICATE_FIRSTNAME,
            familyName: AD4M_PREDICATE_LASTNAME,
          });
          this.username = profile.username;
          this.name = profile.name;
          this.familyName = profile.familyName;
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
  display: block;
  align-items: center;
  background: var(--j-color-ui-50);
  overflow: hidden;
  text-align: center;
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
