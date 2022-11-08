<template>
  <j-box pb="800">
    <j-box pb="500">
      <j-text variant="heading-sm">Notifications</j-text>
    </j-box>
    <j-box pb="300">
      <j-flex a="center" j="between">
        <j-toggle
          class="toggle"
          size="lg"
          :checked="appStore.notification.globalNotification"
          @change="(e) => changeNotificationState()"
        >
          <div>
            <j-text nomargin color="black" weight="600" size="500">
              Enable Desktop Notifications
            </j-text>
          </div>
        </j-toggle>
      </j-flex>
    </j-box>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useAppStore } from "@/store/app";

export default defineComponent({
  setup() {
    const appStore = useAppStore();

    return {
      appStore,
      showConfirm: ref(false),
    };
  },
  methods: {
    changeNotificationState() {
      this.appStore.changeNotificationState(
        !this.appStore.notification.globalNotification
      );
    },
  },
});
</script>

<style scoped>
.toggle::part(base) {
  flex-direction: row-reverse;
}
</style>
