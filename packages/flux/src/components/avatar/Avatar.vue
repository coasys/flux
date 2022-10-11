<template>
  <j-avatar
    :slot="slot"
    :initials="initials"
    :hash="did"
    :src="realSrc"
    :size="size"
    :online="online"
  ></j-avatar>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getImage } from "utils/api/getProfile";
export default defineComponent({
  props: {
    did: String,
    url: String,
    src: String,
    size: String,
    slot: String,
    online: Boolean,
    initials: String,
  },
  data() {
    return { realSrc: "" };
  },
  watch: {
    url: {
      async handler(url) {
        if (url) {
          this.realSrc = await getImage(url);
        } else {
          this.realSrc = "";
        }
      },
      immediate: true,
    },
  },
});
</script>
