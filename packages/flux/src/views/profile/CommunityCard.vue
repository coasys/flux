<template>
  <router-link
    class="community-card"
    :to="{
      name: 'community',
      params: { communityId: uuid },
    }"
  >
    <Avatar
      size="xl"
      :initials="name?.charAt(0).toUpperCase()"
      :url="url"
    ></Avatar>
    <div>
      <j-text size="600" color="black" weight="bold">
        {{ name }}
      </j-text>
      <j-text nomargin size="500" color="ui-400">{{
        description || "No description"
      }}</j-text>
    </div>
  </router-link>
</template>

<script lang="ts">
import Avatar from "@/components/avatar/Avatar.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: { Avatar },
  props: ["uuid", "name", "url", "description"],
  methods: {},
});
</script>

<style scoped>
.community-card {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--j-space-700);
  border-radius: var(--j-border-radius);
  text-decoration: none;
  background-color: var(--j-color-ui-50);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-500);
}

.community-card__image {
  --j-avatar-size: 70px;
}

.community-card:hover {
  background-color: var(--j-color-ui-50);
}

@media (min-width: 800px) {
  .community-card__image {
    --j-avatar-size: 100px;
  }
}
</style>
