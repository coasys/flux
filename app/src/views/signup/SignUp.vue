<template>
  <div class="signup-view">
    <div class="signup-view__intro" v-if="!showSignup">
      <SignUpCarousel />
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

        <avatar-upload icon="camera" :value="profilePicture" @change="(url) => (profilePicture = url)"> </avatar-upload>
        <j-input
          label="Username"
          size="xl"
          :value="username"
          @input="(e: any) => (username = e.target.value)"
          :error="usernameError"
          :errortext="usernameErrorMessage"
          @blur="(e: any) => validateUsername()"
        ></j-input>
        <j-toggle style="width: 100%" full size="lg" variant="primary" @change="allowNotifications"
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

<script setup lang="ts">
import { ad4mConnect } from "@/ad4mConnect";
import AvatarUpload from "@/components/avatar-upload/AvatarUpload.vue";
import Logo from "@/components/logo/Logo.vue";
import { useAppStore } from "@/stores";
import { useValidation } from "@/utils/validation";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { useMe } from "@coasys/ad4m-vue-hooks";
import { createProfile, getAd4mProfile } from "@coasys/flux-api";
import { profileFormatter } from "@coasys/flux-utils";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { registerNotification } from "../../utils/registerMobileNotifications";
import SignUpCarousel from "./SignUpCarousel.vue";

const router = useRouter();
const appStore = useAppStore();

const showSignup = ref(false);
const profilePicture = ref();
const isCreatingUser = ref(false);
const name = ref("");
const familyName = ref("");
const email = ref("");

// Initialize Ad4m client
let clientInstance: any;
const hasUser = ref<Boolean>(false);
(async () => {
  clientInstance = await getAd4mClient();
  const { status } = useMe(clientInstance.agent, profileFormatter);
  hasUser.value = status.value.isInitialized;
})();

// Form validation
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

// Computed properties
const canSignUp = computed(() => usernameIsValid.value);

// Methods
async function checkIfHasFluxProfile() {
  const client = await getAd4mClient();
  const { perspective } = await client.agent.me();
  const fluxLinksFound = perspective?.links.find((e) => e.data.source.startsWith("flux://"));
  return fluxLinksFound ? true : false;
}

async function autoFillUser() {
  try {
    const hasFluxProfile = await checkIfHasFluxProfile();
    if (hasFluxProfile) {
      router.push("/home");
      return;
    }

    showSignup.value = true;

    const ad4mProfile = await getAd4mProfile();

    username.value = ad4mProfile.username || "";
    name.value = ad4mProfile.name || "";
    familyName.value = ad4mProfile.familyName || "";
  } catch (e) {
    console.log(e);
  }
}

async function createUser() {
  isCreatingUser.value = true;

  createProfile({
    givenName: name.value,
    familyName: familyName.value,
    email: email.value,
    username: username.value,
    profilePicture: profilePicture.value,
  })
    .then(() => {
      router.push("/");
      registerNotification();
    })
    .finally(() => {
      isCreatingUser.value = false;
      appStore.changeNotificationState(true);
    });
}

async function allowNotifications(value: any) {
  appStore.changeNotificationState(!appStore.notification.globalNotification);
}

onMounted(() => {
  const authStateChangeHandler = async () => {
    if (ad4mConnect.authState === "authenticated") {
      autoFillUser();
    }
  };

  ad4mConnect.addEventListener("authstatechange", authStateChangeHandler);
  onBeforeUnmount(() => ad4mConnect.removeEventListener("authstatechange", authStateChangeHandler));
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
  place-content: center;
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
