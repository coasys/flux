<template>
  <Suspense>
    <RouterView />
  </Suspense>

  <div class="global-modal" v-if="showGlobalLoading">
    <div class="global-modal__backdrop" />
    <div class="global-modal__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-spinner size="lg" />
        <j-text size="700">Please wait...</j-text>
      </j-flex>
    </div>
  </div>

  <div class="global-modal" v-if="globalError.show">
    <div class="global-modal__backdrop"></div>
    <div class="global-modal__content">
      <j-flex a="center" direction="column" gap="1000">
        <j-icon name="exclamation-triangle" size="xl" color="danger-500" />
        <j-text color="danger-500" weight="600" size="700">
          {{ globalError.message }}
        </j-text>
      </j-flex>
    </div>
  </div>

  <j-toast
    autohide="5"
    :variant="toast.variant"
    :open="toast.open"
    @toggle="(e: any) => appStore.setToast({ open: e.target.open })"
  >
    {{ toast.message }}
  </j-toast>
</template>

<script setup lang="ts">
import { useAppStore, useThemeStore, useUiStore } from "@/stores";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted } from "vue";

const appStore = useAppStore();
const uiStore = useUiStore();
const themeStore = useThemeStore();

const { toast } = storeToRefs(appStore);
const { globalError, showGlobalLoading } = storeToRefs(uiStore);

// Initialise the global theme
onMounted(async () => themeStore.changeCurrentTheme("global"));

// Set up resize listeners to keep track of window width for responsive design
onMounted(() => window.addEventListener("resize", uiStore.updateWindowWidth));
onUnmounted(() => window.removeEventListener("resize", uiStore.updateWindowWidth));
</script>

<style>
:root {
  --app-main-sidebar-width: 100px;
  --app-header-height: 60px;

  j-menu-group::part(summary) {
    margin: 5px 0;
  }

  j-menu-group::part(summary)::after {
    top: 5px;
  }
}

@media (max-width: 800px) {
  :root {
    --app-main-sidebar-width: 75px;
    --j-font-base-size: 15px !important;
  }
}

html {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  font-size: var(--j-font-base-size);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

/* Track */
::-webkit-scrollbar-track {
  background: var(--j-color-white);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-color-white);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--j-color-ui-100);
}

body {
  -webkit-font-smoothing: antialiased;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  text-rendering: optimizeLegibility;
  color: var(--j-color-ui-800);
  font-family: var(--j-font-family);
  background-color: var(--j-color-white);
}

#app {
  height: 100%;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.global-modal {
  z-index: 999;
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
}

.global-modal__backdrop {
  position: absolute;
  left: 0;
  height: 0;
  width: 100%;
  height: 100%;
  background: var(--j-color-white);
  opacity: 0.9;
  backdrop-filter: blur(15px);
}

.global-modal__content {
  position: relative;
}

.global-modal j-spinner {
  --j-spinner-size: 80px;
}
</style>
