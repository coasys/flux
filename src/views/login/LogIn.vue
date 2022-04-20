<template>
  <div class="login-view">
    <div class="login-view__content">
      <j-text variant="heading-lg">Welcome back</j-text>
      <j-flex direction="column" gap="400">
        <j-input
          size="xl"
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
            variant="ghost"
            square
            slot="end"
          >
            <j-icon :name="showPassword ? 'eye-slash' : 'eye'" />
          </j-button>
        </j-input>
        <j-button
          :loading="isLoggingIn"
          full="false"
          size="xl"
          variant="primary"
          @click="logIn"
        >
          Login
        </j-button>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useValidation } from "@/utils/validation";
import { AgentStatus } from "@perspect3vism/ad4m";
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";

export default defineComponent({
  name: "LogIn",
  setup() {
    const userStore = useUserStore();
    const isCreatingUser = ref(false);
    const isLoggingIn = ref(false);
    const showPassword = ref(false);
    const appStore = useAppStore();

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

    watch([password, passwordIsValid], ([password, passwordIsValid]) => {
      if (passwordIsValid) {
        validatePassword();
      }
    });

    const name = ref("");

    const logInError = ref(false);

    return {
      isLoggingIn,
      hasUser: userStore.agent.isInitialized,
      isCreatingUser,
      name,
      password,
      passwordError,
      passwordErrorMessage,
      passwordIsValid,
      validatePassword,
      showPassword,
      logInError,
      userStore,
      appStore
    };
  },
  methods: {
    logIn() {
      this.isLoggingIn = true;
      this.userStore
        .logIn({
          password: this.password,
        })
        .then((data: AgentStatus) => {
          const isUnlocked = data.isUnlocked;
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
          this.appStore.setGlobalLoading(false);
        });
    },
  },
});
</script>

<style lang="scss" scoped>
.login-view {
  padding-left: var(--j-space-900);
  padding-right: var(--j-space-900);
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-view__content {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
</style>
