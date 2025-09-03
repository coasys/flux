<template>
  <j-modal size="xs" :open="isJoiningCommunity">
    <j-box p="500" a="center">
      <HourglassIcon width="30px" />
      <j-text variant="heading">Joining community</j-text>
      <j-text>Please wait...</j-text>
    </j-box>
  </j-modal>
</template>

<script setup lang="ts">
import { HourglassIcon } from "@/components/icons";
import { ref } from "vue";

// Todo: get and update this in the app store
const isJoiningCommunity = ref(false);
</script>

<style scoped></style>
