<template>
  <div class="signup-view">
    <div class="signup-view__intro" v-if="!showSignup">
      <SignUpCarousel />
    </div>

    <div class="signup-view__flow" v-else>
      <j-flex direction="column" gap="400">
        <j-box pb="800">
          <FluxLogoIcon width="150px" />
        </j-box>

        <j-text variant="heading"> Create a user </j-text>

        <AvatarUpload icon="camera" :value="profilePicture" @change="(url) => (profilePicture = url)" />

        <j-input
          label="Username"
          size="xl"
          :value="username"
          @input="(e: any) => (username = e.target.value)"
          :error="usernameError"
          :errortext="usernameErrorMessage"
          @blur="(e: any) => validateUsername()"
        />

        <j-toggle style="width: 100%" full size="lg" variant="primary" @change="allowNotifications">
          Allow Notifications
        </j-toggle>

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
import AvatarUpload from '@/components/avatar-upload/AvatarUpload.vue';
import { FluxLogoIcon } from '@/components/icons';
import { useAppStore, useUiStore } from '@/stores';
import { useValidation } from '@/utils/validation';
import { createProfile, getAd4mProfile } from '@coasys/flux-api';
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { registerNotification } from '../../utils/registerMobileNotifications';
import SignUpCarousel from './SignUpCarousel.vue';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const uiStore = useUiStore();

const showSignup = ref(false);
const profilePicture = ref();
const isCreatingUser = ref(false);
const name = ref('');
const familyName = ref('');
const email = ref('');

// Form validation
const {
  value: username,
  error: usernameError,
  errorMessage: usernameErrorMessage,
  isValid: usernameIsValid,
  validate: validateUsername,
} = useValidation({
  initialValue: '',
  rules: [
    {
      check: (value: string) => (value ? false : true),
      message: 'Username is required',
    },
    {
      check: (value: string) => value.length < 3,
      message: 'Should be 3 or more characters',
    },
  ],
});

const canSignUp = computed(() => usernameIsValid.value);

async function autoFillUser() {
  try {
    const hasFluxAccount = appStore.me.perspective?.links.some((e) => e.data.source.startsWith('flux://'));
    if (hasFluxAccount) return;

    showSignup.value = true;
    const ad4mProfile = await getAd4mProfile(appStore.ad4mClient);
    username.value = ad4mProfile.username || '';
    name.value = ad4mProfile.name || '';
    familyName.value = ad4mProfile.familyName || '';
  } catch (e) {
    console.error('SignUp: Error in autoFillUser:', e);
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
    client: appStore.ad4mClient,
  })
    .then(async () => {
      await appStore.refreshMyProfile();
      
      // Check if there's a redirect path (e.g., from a shared community link)
      const redirectPath = route.query.redirect as string;
      if (redirectPath) {
        router.push(redirectPath);
        // Note: Call window will open automatically via router.afterEach
        // when user enters a channel with an active call
      } else {
        router.push({ name: 'home' });
      }
      registerNotification(appStore.ad4mClient);
    })
    .finally(() => {
      isCreatingUser.value = false;
      appStore.changeNotificationState(true);
    });
}

async function allowNotifications(value: any) {
  appStore.changeNotificationState(!appStore.notification.globalNotification);
}

// Watch for client ready state to trigger autofill
watch(
  () => appStore.initialized,
  async (initialized) => {
    if (initialized) await autoFillUser();
  },
  { immediate: true },
);
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
