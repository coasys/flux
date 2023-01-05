<template>
  <j-skeleton
    :slot="slot"
    variant="circle"
    :height="size"
    :width="size"
    v-if="loading"
  ></j-skeleton>
  <j-avatar
    v-else
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
import { getImage } from "utils/helpers/getImage";
export default defineComponent({
  props: {
    did: String,
    url: String,
    src: String,
    size: {
      type: String,
      default: "md",
    },
    slot: String,
    online: Boolean,
    initials: String,
  },
  data() {
    return { realSrc: null as null | string, loading: false };
  },
  watch: {
    url: {
      handler(url: string) {
        if (url) {
          this.getProfileImage(url);
        } else {
          this.realSrc = null;
        }
      },
      immediate: true,
    },
  },
  methods: {
    async getProfileImage(url: string) {
      try {
        this.loading = true;
        const src = await getImage(url);
        this.realSrc = src || null;
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
j-avatar::part(base) {
  aspect-ratio: 1/1;
}
</style>
