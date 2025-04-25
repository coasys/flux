<template>
  <div class="wrapper" :class="{ 'outline': inCall }">
    <Avatar
      size="xxs"
      :did="did"
      :url="profile?.profileThumbnailPicture"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Avatar from "@/components/avatar/Avatar.vue";

// @ts-ignore
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { useAgent } from "@coasys/ad4m-vue-hooks";
import { Ad4mClient } from "@coasys/ad4m";
import { profileFormatter } from "@coasys/flux-utils";

export default defineComponent({
  components: { Avatar },
  props: {
    did: {
      type: String,
      required: true,
    },
    inCall: {
      type: Boolean,
      default: false,
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

<style lang="scss" scoped>
.wrapper {
  height: 20px;
  z-index: 1;

  &:not(:first-child) {
    margin-left: -10px;
  }

  &.outline {
    border-radius: 50%;
    box-shadow: 0 0 0 1px #e62b63;
  }
}
</style>
