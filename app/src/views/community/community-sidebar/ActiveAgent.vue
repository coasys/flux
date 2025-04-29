<template>
  <div>
    <j-avatar
      size="xxs"
      :did="did"
      :src="profile?.profileThumbnailPicture"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getCachedAgentProfile } from "@coasys/flux-utils";
export default defineComponent({
  props: { did: { type: String, required: true } },
  async setup(props) {
    const profile = await getCachedAgentProfile(props.did)
    return { profile };
  },
});
</script>

<style lang="scss" scoped></style>
