import type { UIStore } from "@/store/types";
import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";

export const useUIStore = defineStore("ui", () => {
  const state = reactive<UIStore>({
    showSidebar: true,
    showMainSidebar: true,
    sidebarWidth: 330,
    showGlobalLoading: false,
    globalError: { show: false, message: "" },
    windowState: "visible",
  });

  // Mutations
  function toggleSidebar(): void {
    state.showSidebar = !state.showSidebar;
  }

  function toggleMainSidebar(): void {
    state.showMainSidebar = !state.showMainSidebar;
  }

  function setMainSidebar(open: boolean): void {
    state.showMainSidebar = open;
  }

  function setSidebar(open: boolean): void {
    state.showSidebar = open;
  }

  function setSidebarWidth(width: number): void {
    state.sidebarWidth = width;
  }

  function setWindowState(payload: "minimize" | "visible" | "foreground"): void {
    state.windowState = payload;
  }

  function setGlobalLoading(payload: boolean): void {
    state.showGlobalLoading = payload;
  }

  function setGlobalError(payload: { show: boolean; message: string }): void {
    state.globalError = payload;
  }

  return {
    // State
    ...toRefs(state),

    // Mutations
    toggleSidebar,
    toggleMainSidebar,
    setMainSidebar,
    setSidebar,
    setSidebarWidth,
    setWindowState,
    setGlobalLoading,
    setGlobalError,
  };
});
