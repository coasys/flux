<template>
  <div class="community-welcome">
    <j-flex direction="column" gap="700">
      <div>
        <j-text variant="heading-lg">{{ community.name }}</j-text>
        <j-text variant="ingress"> {{ community.description }} </j-text>
      </div>
      <j-flex a="center" gap="500">
        <j-button
          variant="primary"
          size="lg"
          @click="() => setShowCreateChannel(true)"
        >
          Create a new channel
          <j-icon slot="end" name="plus" />
        </j-button>
        <j-text nomargin>or</j-text>
        <j-button
          variant="primary"
          size="lg"
          @click="() => setShowInviteCode(true)"
        >
          Invite someone
          <j-icon slot="end" name="person-plus" />
        </j-button>
      </j-flex>
    </j-flex>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { mapMutations } from "vuex";
import { CommunityState } from "@/store";

export default defineComponent({
  name: "CommunityHomeView",
  methods: {
    ...mapMutations(["setShowCreateChannel", "setShowInviteCode"]),
  },
  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
  },
});
</script>

<style scoped>
.community-welcome {
  padding: var(--j-space-900);
  max-width: 1000px;
}
</style>
