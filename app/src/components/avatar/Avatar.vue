<template>
  <j-avatar
    :hash="did"
    :src="displaySrc"
    :initials="initials"
    :online="online"
    :slot="slot"
    :size="size"
  ></j-avatar>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import { getCachedAgentProfile } from "@/utils/userProfileCache";
export default defineComponent({
  props: {
    did: String,
    src: String,
    initials: String,
    online: Boolean,
    slot: String,
    size: { type: String, default: "md" },
  },
  setup(props) {
    const realSrc = ref<string | null>(null);
    const displaySrc = computed(() => props.src || realSrc.value);

    onMounted(async () => {
      // Get the profile picture from the app store if no src is provided and a DID is available
      if (props.src || !props.did) return;
      const userProfile = await getCachedAgentProfile(props.did);
      realSrc.value = userProfile.profileThumbnailPicture || null;
    })

    return {
      displaySrc,
      size: props.size,
      initials: props.initials,
      online: props.online,
      slot: props.slot,
    };
  },
});
</script>

<style scoped>
j-avatar::part(base) {
  aspect-ratio: 1/1;
}
</style>
