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
          @change="changeNotificationState"
        >
          <div>
            <j-text nomargin color="black" weight="600" size="500"> Enable Desktop Notifications </j-text>
          </div>
        </j-toggle>
      </j-flex>
    </j-box>
  </j-box>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores";

const appStore = useAppStore();

function changeNotificationState() {
  appStore.changeNotificationState(!appStore.notification.globalNotification);
}
</script>

<style scoped>
.toggle::part(base) {
  flex-direction: row-reverse;
}
</style>
