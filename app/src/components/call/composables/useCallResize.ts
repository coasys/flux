import { useUiStore } from "@/stores";
import { storeToRefs } from "pinia";
import { ref, type Ref } from "vue";

export function useCallResize(callWindow: Ref<HTMLElement | null>, rightSection: Ref<HTMLElement | null>) {
  const uiStore = useUiStore();
  const { communitySidebarWidth, callWindowWidth } = storeToRefs(uiStore);

  const isDragging = ref(false);
  const startX = ref(0);
  const startWidth = ref(0);

  function startResize(e: MouseEvent) {
    if (!callWindow.value) return;

    startWidth.value = callWindow.value.getBoundingClientRect().width;
    isDragging.value = true;
    startX.value = e.clientX;

    // Prevent text selection & width transitions during drag
    const mainAppLayout = document.getElementById("app-layout-main");
    if (mainAppLayout) mainAppLayout.style.transition = "none";
    callWindow.value.style.transition = "none";
    document.body.classList.add("text-selection-disabled");

    document.addEventListener("mousemove", doResize, false);
    document.addEventListener("mouseup", stopResize, false);
  }

  function doResize(e: MouseEvent) {
    if (!rightSection.value) return;

    const minWidth = rightSection.value.getBoundingClientRect().width / 5 || 0;
    const maxWidth = window.innerWidth - communitySidebarWidth.value - 100;
    const newWidth = startWidth.value + (startX.value - e.clientX);

    uiStore.setCallWindowWidth(Math.min(Math.max(minWidth, newWidth), maxWidth));
  }

  function stopResize() {
    if (!callWindow.value) return;

    isDragging.value = false;

    // Update the call window fullscreen state
    const fullWindowWidth = window.innerWidth;
    const isFullscreen = fullWindowWidth - callWindowWidth.value <= communitySidebarWidth.value + 100;
    uiStore.setCallWindowFullscreen(isFullscreen);

    // Reset the transition styles and remove the global resizing class
    const mainAppLayout = document.getElementById("app-layout-main");
    if (mainAppLayout) mainAppLayout.style.transition = "width 0.5s ease-in-out";
    callWindow.value.style.transition = "all 0.5s ease-in-out";
    document.body.classList.remove("text-selection-disabled");

    // Remove event listeners
    document.removeEventListener("mousemove", doResize);
    document.removeEventListener("mouseup", stopResize);
  }

  return {
    startResize,
    isDragging,
  };
}
