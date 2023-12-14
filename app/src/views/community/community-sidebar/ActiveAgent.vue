<template>
  <div>
    <Avatar
      size="xxs"
      :did="did"
      :url="profile?.profileThumbnailPicture"
    ></Avatar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Avatar from "@/components/avatar/Avatar.vue";

// @ts-ignore
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { useAgent } from "@coasys/flux-vue";
import { Ad4mClient } from "@coasys/ad4m";

export default defineComponent({
  components: { Avatar },
  props: {
    did: {
      type: String,
      required: true,
    },
  },
  async setup(props) {
    const client: Ad4mClient = await getAd4mClient();

    const { profile } = useAgent(client.agent, () => props.did);

    return {
      profile,
    };
  },
  computed: {},
  methods: {},
});
</script>

<style lang="scss" scoped></style>
