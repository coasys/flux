<template>
  <j-avatar
    :slot="slot"
    :initials="initials"
    :hash="did"
    :src="src"
    :size="size"
    :online="online"
  ></j-avatar>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getImage } from "@/utils/profileHelpers";
export default defineComponent({
  props: {
    did: String,
    url: String,
    size: String,
    slot: String,
    online: Boolean,
    initials: String,
  },
  data() {
    return { src: "" };
  },
  watch: {
    url: {
      async handler(url) {
        if (url) {
          this.src = await getImage(url);
        } else {
          this.src = "";
        }
      },
      immediate: true,
    },
  },
});
</script>
