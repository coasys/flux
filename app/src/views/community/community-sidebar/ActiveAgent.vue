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
// @ts-ignore
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { useAgent } from "@coasys/ad4m-vue-hooks";
import { Ad4mClient } from "@coasys/ad4m";
import { profileFormatter } from "@coasys/flux-utils";

export default defineComponent({
  props: {
    did: {
      type: String,
      required: true,
    },
  },
  async setup(props) {
    const client: Ad4mClient = await getAd4mClient();

    const { profile } = useAgent(client.agent, () => props.did, profileFormatter);

    return {
      profile,
    };
  },
  computed: {},
  methods: {},
});
</script>

<style lang="scss" scoped></style>
