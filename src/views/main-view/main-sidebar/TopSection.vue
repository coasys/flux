<template>
  <div class="left-nav__top-section">
    <router-link
      :to="{
        name: 'home',
        params: { did }
      }"
      custom
      v-slot="{ navigate }"
    >
      <j-tooltip title="Home">
        <j-avatar
          class="left-nav__profile-icon"
          size="xl"
          :hash="userDid"
          :src="userProfile?.profilePicture"
          @click="() => navigate()"
        ></j-avatar>
      </j-tooltip>
    </router-link>
  </div>
</template>

<script lang="ts">
import { useAppStore } from "@/store/app";
import { defineComponent } from "vue";
import { mapActions } from "pinia";
import { useUserStore } from "@/store/user";
import { Profile } from "@/store/types/userprofile";

export default defineComponent({
  name: "topsection",
  setup() {
    const userStore = useUserStore();

    return {
      did: userStore.agent.did,
      userStore
    }
  },
  methods: {
    ...mapActions(useAppStore, ["setShowCreateCommunity"]),
  },
  computed: {
        userProfile(): Profile | null {
      return this.userStore.profile;
    },
    userDid(): string {
      return this.userStore.agent.did!;
    },
  }
});
</script>

<style lang="scss" scoped>
.left-nav__top-section {
  width: 100%;
  padding: var(--j-space-500) 0;
  display: flex;
  gap: var(--j-space-400);
  flex-direction: column;
  align-items: center;
}

.left-nav__profile-icon {
  cursor: pointer;
}

j-button.active {
  display: inline-block;
  border-radius: 50%;
  --j-button-opacity: 1;
}

j-avatar {
  cursor: pointer;
}
</style>
